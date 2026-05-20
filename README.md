# Dr. Personalizados — Site B2B

Site de vendas estático da Dr. Personalizados (braço B2B da Mymos com Amor).

## Como subir no GitHub Pages

### Setup inicial (uma vez só, ~10 min)

1. Cria conta em [github.com](https://github.com) se não tiver
2. Clica no botão verde **"New"** repositório no canto superior esquerdo
3. Nome do repo: `drpersonalizados` (ou o que preferir)
4. Marca **Public**
5. Marca **"Add a README file"**
6. Clica em **"Create repository"**

### Subir os arquivos (~2 min)

7. Dentro do repo recém-criado, clica em **"Add file" → "Upload files"**
8. Arrasta o `index.html` E a pasta `assets/` inteira pra área de upload
9. Em baixo, escreve uma mensagem de commit (ex: "Primeira versão") e clica em **"Commit changes"** (botão verde)

### Ativar o GitHub Pages (~1 min)

10. No repo, clica em **Settings** (engrenagem no topo direito)
11. No menu lateral, clica em **Pages**
12. Em "Source", escolhe **"Deploy from a branch"**
13. Em "Branch", escolhe **main** e pasta **/ (root)**, clica em **Save**
14. Espera ~30 segundos. O site fica no ar em:
    `https://SEU_USUARIO_GITHUB.github.io/drpersonalizados`

### Atualizar imagens ou texto depois

- Vai no arquivo no GitHub → ícone de lápis (editar)
- Edita ou clica em "Replace this file" pra trocar
- Mensagem de commit → "Commit changes"
- Em ~30s o site atualiza no ar

## Estrutura

```
.
├── index.html              # Página única do site
├── assets/                 # Todas as imagens (1.1MB total)
│   ├── hero-vinho.jpg      # Foto do topo
│   ├── triplex-15-25.jpg   # Kit triplex 15x15
│   ├── triplex-aberta.jpg  # Kit triplex 25x15
│   ├── tacas.jpg           # Premium taças
│   ├── mini-whisky.jpg     # Premium mini whisky
│   ├── vinho.jpg           # Premium vinho
│   ├── perfume.jpg         # Premium perfume
│   ├── velas.jpg           # Premium velas
│   ├── chandon.jpg         # Premium taças+chandon
│   └── feedback-01.jpg     # Galeria de feedbacks (06 fotos)
│       feedback-02.jpg     #   - Ollive Fotografia
│       feedback-03.jpg     #   - Numerari Contabilidade
│       feedback-04.jpg     #   - Sedução Moda Íntima
│       feedback-05.jpg     #   - Novo Tempo
│       feedback-06.jpg     #   - Numerari Contabilidade
│       └── ...
└── README.md
```

## Trocar uma imagem

1. Substitui o arquivo correspondente em `assets/` (mantém o mesmo nome)
2. Faz commit no GitHub
3. Pronto

Dimensões recomendadas (mas qualquer tamanho funciona, o CSS faz `object-fit: cover`):
- `hero-vinho.jpg` → 1200×1140 px
- `triplex-*.jpg` → 1000×850 px
- Premium (taças, vinho, etc) → 800×600 px
- `feedback-*.jpg` → 1000×1000 px (quadradas)

Antes de subir, otimiza com [tinypng.com](https://tinypng.com) ou [squoosh.app](https://squoosh.app).

## Domínio próprio (opcional)

Se quiser usar `drpersonalizados.com.br` em vez do endereço `.github.io`:

1. Compra o domínio em [registro.br](https://registro.br) (~R$40/ano)
2. No painel do Registro.br, aponta os registros DNS pro GitHub Pages:
   - 4 registros A pra `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 registro CNAME `www` apontando pro `SEU_USUARIO.github.io`
3. No GitHub: Settings → Pages → Custom domain → digita `drpersonalizados.com.br` → Save
4. Aguarda DNS propagar (até 24h, geralmente 1-2h)
5. Marca "Enforce HTTPS" quando ficar disponível

## Contatos

- WhatsApp: (31) 98048-2254
- Instagram: [@drpersonalizadosbr](https://www.instagram.com/drpersonalizadosbr/)
- Empresa: Mymos com Amor (CNPJ 54.713.426/0001-11)
