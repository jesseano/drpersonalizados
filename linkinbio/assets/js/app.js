/* =====================================================================
   Dr. Personalizados — Link na bio
   Configuração: preencha os placeholders abaixo.
   ===================================================================== */
var CONFIG = {
  WHATSAPP: "5531971770899",                 // (31) 97177-0899
  INSTAGRAM: "https://www.instagram.com/drpersonalizadosbr/",

  // Endpoint de captura de leads. Suporta:
  //  - Google Apps Script Web App (doPost) -> cole a URL /exec
  //  - Google Form: cole a URL ".../formResponse" e mapeie os entry.IDs em LEAD_FORM_FIELDS
  // Deixe "" para pular o registro (o redirect pro WhatsApp continua funcionando).
  LEAD_ENDPOINT: "https://script.google.com/macros/s/AKfycbwQSn9ajwOT3ar0YVwSLfiWVjEuyuZ7uU9O0u8n1oxPt26M4kqrpTF2NJrpB1qjICl7DQ/exec",
  LEAD_FORM_FIELDS: { nome: "entry.000000000", whats: "entry.111111111" }, // só p/ Google Form

  // (Opcional) Planilha de modelos/preços em formato gviz CSV. Deixe "" para usar os cards fixos do HTML.
  // Ex.: https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Modelos
  // Colunas esperadas: titulo,preco,sufixo,descricao,imagem,mensagem
  MODELOS_SHEETS_CSV: "",
  MODELOS_CACHE_MIN: 10
};

(function () {
  "use strict";

  /* ---------- Helpers ---------- */
  function waLink(text) {
    return "https://wa.me/" + CONFIG.WHATSAPP + "?text=" + encodeURIComponent(text);
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- UTMs / atribuição de origem ----------
     Captura os parâmetros da URL na chegada e guarda na sessão,
     pra não perder a origem se a URL mudar durante a navegação. */
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  var utmData = (function () {
    var out = {};
    try {
      var stored = JSON.parse(sessionStorage.getItem("drp_utms") || "{}");
      var params = new URLSearchParams(location.search);
      UTM_KEYS.forEach(function (k) {
        var v = params.get(k) || stored[k] || "";
        if (v) out[k] = v;
      });
      // guarda o referrer só na primeira visita da sessão
      out.referrer = stored.referrer || document.referrer || "";
      sessionStorage.setItem("drp_utms", JSON.stringify(out));
    } catch (e) { /* sessionStorage indisponível: segue sem UTM */ }
    return out;
  })();

  document.getElementById("yr").textContent = new Date().getFullYear();
  var ig = document.getElementById("igLink");
  if (ig) ig.href = CONFIG.INSTAGRAM;
  var fw = document.getElementById("footWa");
  if (fw) fw.href = waLink("Oi! Vim pelo Instagram e quero um orçamento de caixas personalizadas.");

  /* ---------- Bottom sheet ---------- */
  var sheet = document.getElementById("sheet");
  var form = document.getElementById("quoteForm");
  var sheetEyebrow = document.getElementById("sheetEyebrow");
  var currentIntent = "";       // mensagem-base do item escolhido
  var lastFocus = null;

  function openSheet(intent, label) {
    currentIntent = intent || "Quero um orçamento de caixas personalizadas.";
    if (sheetEyebrow && label) sheetEyebrow.textContent = label;
    lastFocus = document.activeElement;
    sheet.hidden = false;
    document.body.classList.add("no-scroll");
    // força reflow p/ animar a entrada
    void sheet.offsetWidth;
    sheet.classList.add("open");
    setTimeout(function () { var n = $("#nome"); if (n) n.focus(); }, 280);
  }
  function closeSheet() {
    sheet.classList.remove("open");
    document.body.classList.remove("no-scroll");
    setTimeout(function () { sheet.hidden = true; }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Todo gatilho data-wa abre o sheet (com fallback href p/ no-JS)
  $all("[data-wa]").forEach(function (el) {
    var intent = el.getAttribute("data-wa");
    var label = el.getAttribute("data-label") || "Orçamento";
    if (el.tagName === "A") el.setAttribute("href", waLink(intent)); // fallback sem captura
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openSheet(intent, label);
    });
  });

  if (sheet) {
    document.getElementById("sheetClose").addEventListener("click", closeSheet);
    sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) closeSheet();
    });
  }

  /* ---------- Máscara de telefone BR ---------- */
  function maskPhone(v) {
    var d = (v || "").replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return d ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }
  var whatsEl0 = document.getElementById("whats");
  if (whatsEl0) {
    whatsEl0.addEventListener("input", function () {
      var pos = this.value.length === this.selectionStart;
      this.value = maskPhone(this.value);
      if (pos) this.selectionStart = this.selectionEnd = this.value.length;
    });
  }

  /* ---------- Validação ---------- */
  function validName(v) { return v.trim().length >= 2; }
  function validPhone(v) {
    var digits = (v || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13; // DDD + número (com/sem 55)
  }
  function setInvalid(input, bad) { input.setAttribute("aria-invalid", bad ? "true" : "false"); }

  /* ---------- Registro de lead (best-effort, não bloqueia o redirect) ---------- */
  function registerLead(nome, whats) {
    if (!CONFIG.LEAD_ENDPOINT) return Promise.resolve();
    var url = CONFIG.LEAD_ENDPOINT;
    try {
      if (/formResponse/.test(url)) {
        // Google Form
        var f = CONFIG.LEAD_FORM_FIELDS || {};
        var body = new URLSearchParams();
        if (f.nome) body.append(f.nome, nome);
        if (f.whats) body.append(f.whats, whats);
        return fetch(url, { method: "POST", mode: "no-cors", body: body });
      }
      // Apps Script Web App (ou endpoint próprio): JSON
      var payload = {
        nome: nome,
        whats: whats,
        interesse: currentIntent,
        origem: utmData.utm_source || "bio",
        utm_source: utmData.utm_source || "",
        utm_medium: utmData.utm_medium || "",
        utm_campaign: utmData.utm_campaign || "",
        utm_content: utmData.utm_content || "",
        utm_term: utmData.utm_term || "",
        referrer: utmData.referrer || "",
        ts: Date.now()
      };
      return fetch(url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    } catch (e) { return Promise.resolve(); }
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nomeEl = $("#nome"), whatsEl = $("#whats");
      var nome = nomeEl.value.trim(), whats = whatsEl.value.trim();
      var okN = validName(nome), okW = validPhone(whats);
      setInvalid(nomeEl, !okN); setInvalid(whatsEl, !okW);
      if (!okN) { nomeEl.focus(); return; }
      if (!okW) { whatsEl.focus(); return; }

      var msg = "Oi! Sou " + nome + ". " + currentIntent;
      var target = waLink(msg);

      // registra o lead sem segurar o usuário; redireciona logo em seguida
      registerLead(nome, whats);
      var win = window.open(target, "_blank");

      // fallback se o popup/redirect for bloqueado: vira um botão "Abrir WhatsApp"
      if (!win) {
        var note = $(".form-note", form);
        if (note) {
          note.innerHTML = '<a class="btn btn-ghost" href="' + target +
            '" target="_blank" rel="noopener" style="margin-top:6px">Abrir WhatsApp</a>';
        }
      } else {
        closeSheet();
      }
    });
  }

  /* ---------- Lightbox: zoom das fotos do portfólio ---------- */
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  var lbCap = document.getElementById("lightboxCap");
  var lbLastFocus = null;

  function openLightbox(src, caption, alt) {
    if (!lb) return;
    lbImg.src = src; lbImg.alt = alt || caption || "";
    lbCap.textContent = caption || "";
    lbLastFocus = document.activeElement;
    lb.hidden = false;
    document.body.classList.add("no-scroll");
    void lb.offsetWidth;            // reflow p/ animar
    lb.classList.add("open");
    var c = document.getElementById("lightboxClose");
    if (c) c.focus();
  }
  function closeLightbox() {
    lb.classList.remove("open");
    document.body.classList.remove("no-scroll");
    setTimeout(function () { lb.hidden = true; lbImg.src = ""; }, 220);
    if (lbLastFocus && lbLastFocus.focus) lbLastFocus.focus();
  }
  if (lb) {
    document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
    // clicar fora da imagem fecha (no fundo ou na figure)
    lb.addEventListener("click", function (e) {
      if (e.target === lb || e.target.tagName === "FIGURE") closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !lb.hidden) closeLightbox();
    });
  }

  /* ---------- Carrossel: arrastar com o mouse (desktop) + clique p/ ampliar ---------- */
  var car = document.querySelector(".carousel");
  if (car) {
    var down = false, startX = 0, startScroll = 0, moved = false;
    car.addEventListener("pointerdown", function (e) {
      moved = false;
      if (e.pointerType !== "mouse") return; // toque usa scroll nativo
      down = true; startX = e.clientX; startScroll = car.scrollLeft;
      car.classList.add("dragging");
    });
    car.addEventListener("pointermove", function (e) {
      if (!down) return;
      if (Math.abs(e.clientX - startX) > 6) moved = true;
      car.scrollLeft = startScroll - (e.clientX - startX);
    });
    function endDrag() { down = false; car.classList.remove("dragging"); }
    car.addEventListener("pointerup", endDrag);
    car.addEventListener("pointerleave", endDrag);
    car.addEventListener("pointercancel", endDrag);

    // cada foto vira clicável e abre ampliada (ignora se foi arraste)
    $all("figure img", car).forEach(function (img) {
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.addEventListener("click", function () {
        if (moved) { moved = false; return; }
        var fig = img.closest("figure");
        var cap = fig ? $("figcaption", fig) : null;
        openLightbox(img.currentSrc || img.src, cap ? cap.textContent : "", img.alt);
      });
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); img.click(); }
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $all(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $all(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Bloco 3 (opcional): preços via Google Sheets CSV ---------- */
  function parseCSV(text) {
    var rows = [], row = [], cur = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') { q = false; }
        else { cur += c; }
      } else if (c === '"') { q = true; }
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cur); cur = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = [];
      } else { cur += c; }
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }

  function renderModels(items) {
    var list = document.getElementById("modelsList");
    if (!list || !items.length) return;
    var html = items.map(function (m) {
      var price = m.preco ? m.preco : "Sob orçamento";
      var suf = m.sufixo ? ' <small>· ' + esc(m.sufixo) + '</small>' : "";
      var img = m.imagem || "assets/img/modelos/premium.svg";
      var wa = waLink(m.mensagem || ("Quero um orçamento do modelo " + m.titulo + "."));
      return '<article class="model">' +
        '<img src="' + esc(img) + '" alt="' + esc(m.titulo) + '" width="120" height="120" loading="lazy">' +
        '<div class="body"><h3>' + esc(m.titulo) + '</h3>' +
        '<div class="price">' + esc(price) + suf + '</div>' +
        '<p class="desc">' + esc(m.descricao || "") + '</p>' +
        '<a class="mbtn" target="_blank" rel="noopener" href="' + wa + '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.06 24l1.69-6.16a11.87 11.87 0 01-1.6-5.95C.16 5.34 5.5 0 12.06 0a11.82 11.82 0 018.41 3.49 11.82 11.82 0 013.48 8.42c0 6.55-5.34 11.89-11.9 11.89a11.9 11.9 0 01-5.68-1.45L.06 24z"/></svg>Quero esse</a>' +
        '</div></article>';
    }).join("");
    list.innerHTML = html;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function loadModels() {
    if (!CONFIG.MODELOS_SHEETS_CSV) return; // usa os cards fixos do HTML
    var key = "drp_modelos";
    try {
      var cached = JSON.parse(sessionStorage.getItem(key) || "null");
      if (cached && (Date.now() - cached.t) < CONFIG.MODELOS_CACHE_MIN * 60000) {
        renderModels(cached.d); return;
      }
    } catch (e) {}

    var status = document.getElementById("modelosStatus");
    if (status) status.textContent = "carregando…";

    fetch(CONFIG.MODELOS_SHEETS_CSV)
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.text(); })
      .then(function (txt) {
        var rows = parseCSV(txt);
        if (rows.length < 2) throw new Error("vazio");
        var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
        var items = rows.slice(1).map(function (r) {
          var o = {}; head.forEach(function (h, i) { o[h] = (r[i] || "").trim(); }); return o;
        }).filter(function (o) { return o.titulo; });
        renderModels(items);
        if (status) status.textContent = "a partir de";
        try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: items })); } catch (e) {}
      })
      .catch(function () {
        if (status) status.textContent = "a partir de"; // mantém os cards fixos do HTML
      });
  }
  loadModels();
})();
