/**
 * Dr. Personalizados — Receptor de leads do site (v4)
 *
 * Grava na planilha PRÓPRIA do Jessé (sem dependência de permissão de terceiros).
 *
 * Setup:
 * 1. PLANILHA_ID abaixo já tá configurada com a tua planilha
 * 2. Cola este código no editor do Apps Script
 * 3. Salva (Ctrl+S)
 * 4. Rode setupPlanilha() UMA VEZ pra criar os headers
 * 5. Reimplantar mantendo a mesma URL:
 *    Implantar → Gerenciar implantações → ✏️ → Nova versão → Implantar
 */

const PLANILHA_ID = '1LHKIQccY17OQ_5K5l1jfaQ9u_O8XDDhqn920aa49YfA';
const ABA = 'Leads';
const NOTIFICAR_EMAIL = 'contato@mymoscomamor.com.br'; // deixa '' pra desativar

/**
 * Cria/atualiza os cabeçalhos da planilha.
 * RODA UMA VEZ ao configurar.
 */
function setupPlanilha() {
  const ss = SpreadsheetApp.openById(PLANILHA_ID);
  let aba = ss.getSheetByName(ABA);
  if (!aba) aba = ss.insertSheet(ABA);

  const headers = [
    'Data/Hora',
    'Nome',
    'WhatsApp',
    'E-mail',
    'Interesse',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'Referrer',
    'Landing Page',
    'Origem',
    'Status'
  ];
  aba.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#123044')
    .setFontColor('#ffffff');
  aba.setColumnWidths(1, headers.length, 140);
  aba.setColumnWidth(1, 160);
  aba.setColumnWidth(11, 200);
  aba.setColumnWidth(12, 220);
  aba.setFrozenRows(1);
  Logger.log('✓ Planilha configurada. Headers: ' + headers.join(' | '));
}

/**
 * Endpoint POST — recebe os dados do formulário.
 */
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.openById(PLANILHA_ID);
    const aba = ss.getSheetByName(ABA);
    if (!aba) throw new Error('Aba "' + ABA + '" não encontrada. Rode setupPlanilha() primeiro.');

    const novaLinha = [
      new Date(),
      dados.nome || '',
      dados.whatsapp || '',
      dados.email || '',
      dados.interesse || '',
      dados.utm_source || '',
      dados.utm_medium || '',
      dados.utm_campaign || '',
      dados.utm_content || '',
      dados.utm_term || '',
      dados.referrer || '',
      dados.landing_page || '',
      dados.origem || 'site',
      'Novo'
    ];

    aba.appendRow(novaLinha);

    if (NOTIFICAR_EMAIL) {
      const utmInfo = (dados.utm_source || dados.utm_campaign)
        ? 'Origem: ' + (dados.utm_source || '-') + ' / ' + (dados.utm_medium || '-') + ' / ' + (dados.utm_campaign || '-')
        : 'Origem: tráfego direto';

      const corpo = [
        '🔔 Novo lead Dr. Personalizados',
        '',
        'Nome: ' + (dados.nome || '-'),
        'WhatsApp: ' + (dados.whatsapp || '-'),
        'E-mail: ' + (dados.email || '-'),
        'Interesse: ' + (dados.interesse || '-'),
        utmInfo,
        '',
        'Planilha: https://docs.google.com/spreadsheets/d/' + PLANILHA_ID,
        '',
        '— Sistema Dr. Personalizados'
      ].join('\n');

      MailApp.sendEmail({
        to: NOTIFICAR_EMAIL,
        subject: '🔔 Novo lead site — ' + (dados.nome || 'sem nome'),
        body: corpo
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, linha: aba.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('ERRO: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, erro: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: true,
      mensagem: 'Receptor de leads Dr. Personalizados v4 ativo',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function testar() {
  const dadosTeste = {
    nome: 'Teste Dr Personalizados',
    whatsapp: '(31) 99999-9999',
    email: 'teste@drpersonalizados.com.br',
    interesse: 'Caixas Premium',
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'teste_integracao',
    utm_content: 'criativo-A',
    utm_term: '',
    referrer: 'https://facebook.com/',
    landing_page: 'https://drpersonalizados.com.br/?utm_source=facebook&utm_medium=cpc&utm_campaign=teste'
  };

  const e = { postData: { contents: JSON.stringify(dadosTeste) } };
  const resp = doPost(e);
  Logger.log(resp.getContent());
}
