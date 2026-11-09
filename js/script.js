/* ==========================================================================
   IncluiPro — script.js : RECURSOS DE ACESSIBILIDADE (todas as páginas)
   Controla o painel lateral: tamanho da letra, alto contraste, menos movimento,
   "ouvir a página" (voz do navegador), atalhos de teclado e o menu do celular.
   As escolhas da pessoa ficam no localStorage (chaves "acessibilidade-...").
   ========================================================================== */
(function () {
  /* getEl nunca devolve null: um elemento ausente numa página não derruba o resto do script */
  function getEl(id) { return document.getElementById(id) || document.createElement('div'); }
  var body = document.body;
  var announcer = getEl('announcer');

  function announce(msg) {
    announcer.textContent = '';
    setTimeout(function () { announcer.textContent = msg; }, 30);
  }
  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  /* ---------- Font scale ---------- */
  var scales = [0.9, 1, 1.15, 1.3, 1.45];
  var scaleIdx = 1;
  var savedScale = safeGet('acessibilidade-escala-letra');
  if (savedScale !== null && scales[Number(savedScale)]) scaleIdx = Number(savedScale);
  var fontValue = getEl('valor-letra');

  function applyScale() {
    document.documentElement.style.setProperty('--font-scale', scales[scaleIdx]);
    fontValue.textContent = Math.round(scales[scaleIdx] * 100) + '%';
    body.classList.toggle('escala-grande', scales[scaleIdx] >= 1.3);
    safeSet('acessibilidade-escala-letra', scaleIdx);
  }
  applyScale();

  getEl('aumentar-letra').addEventListener('click', function () {
    scaleIdx = Math.min(scaleIdx + 1, scales.length - 1);
    applyScale();
    announce('Texto ampliado para ' + Math.round(scales[scaleIdx] * 100) + ' por cento');
  });
  getEl('diminuir-letra').addEventListener('click', function () {
    scaleIdx = Math.max(scaleIdx - 1, 0);
    applyScale();
    announce('Texto reduzido para ' + Math.round(scales[scaleIdx] * 100) + ' por cento');
  });

  /* ---------- High contrast ---------- */
  var contrastBtn = getEl('botao-contraste');
  function setContrast(on, silent) {
    body.classList.toggle('high-contrast', on);
    contrastBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    safeSet('acessibilidade-contraste', on ? '1' : '0');
    if (!silent) announce(on ? 'Alto contraste ativado' : 'Alto contraste desativado');
  }
  setContrast(safeGet('acessibilidade-contraste') === '1', true);
  contrastBtn.addEventListener('click', function () { setContrast(!body.classList.contains('high-contrast')); });

  /* ---------- Reduced motion ---------- */
  var motionBtn = getEl('botao-movimento');
  function setMotion(on, silent) {
    body.classList.toggle('reduce-motion', on);
    motionBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    safeSet('acessibilidade-movimento', on ? '1' : '0');
    if (!silent) announce(on ? 'Movimento reduzido ativado' : 'Movimento reduzido desativado');
  }
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setMotion(safeGet('acessibilidade-movimento') === '1' || (safeGet('acessibilidade-movimento') === null && prefersReduced), true);
  motionBtn.addEventListener('click', function () { setMotion(!body.classList.contains('reduce-motion')); });

  /* ---------- Read aloud ---------- */
  var readBtn = getEl('botao-ouvir');
  var speaking = false;
  function stopReading(silent) {
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {}
    speaking = false;
    readBtn.setAttribute('aria-pressed', 'false');
    readBtn.textContent = '🔊 Começar a ouvir';
    if (!silent) announce('Leitura interrompida');
  }
  function startReading() {
    try {
      if (!window.speechSynthesis) { announce('Leitura em voz alta não é compatível com este navegador'); return; }
      var main = getEl('main-content');
      var text = main.innerText.replace(/\s+/g, ' ').trim();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1;
      utterance.onend = function () { stopReading(true); };
      utterance.onerror = function () { stopReading(true); };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      speaking = true;
      readBtn.setAttribute('aria-pressed', 'true');
      readBtn.textContent = '⏸ Parar leitura';
      announce('Lendo o conteúdo da página');
    } catch (e) { announce('Não foi possível iniciar a leitura em voz alta'); }
  }
  readBtn.addEventListener('click', function () { if (speaking) stopReading(); else startReading(); });

  /* ---------- Tradutor de Libras (VLibras) ----------
     VLibras é o tradutor GRATUITO do governo federal: um intérprete virtual 3D
     (avatar) que traduz o texto da página para Libras.
     Como funciona aqui:
       1) Ao abrir qualquer página, carregamos o script oficial (vlibras.gov.br) e aparece
          o botão azul de Libras na lateral direita da tela.
       2) A pessoa clica no botão e depois seleciona/clica no texto para ver a tradução.
       3) O botão "Abrir tradutor de Libras" do painel de acessibilidade abre o mesmo avatar.
     Precisa de internet (o avatar e o dicionário ficam nos servidores do governo). */
  var vlibrasBox = null;
  function abrirVLibras() {
    var b = document.querySelector('[vw-access-button]');
    if (b) b.click();
    else announce('O tradutor de Libras ainda está carregando. Tente novamente em alguns segundos.');
  }
  function carregarVLibras(abrirDepois) {
    if (vlibrasBox) { if (abrirDepois) abrirVLibras(); return; }     /* já carregado: só abre */
    /* Estrutura HTML que o VLibras exige (atributos vw, vw-access-button e vw-plugin-wrapper) */
    vlibrasBox = document.createElement('div');
    vlibrasBox.setAttribute('vw', '');
    vlibrasBox.className = 'enabled';
    vlibrasBox.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
    body.appendChild(vlibrasBox);
    var sc = document.createElement('script');
    sc.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    sc.onload = function () {
      try { new window.VLibras.Widget('https://vlibras.gov.br/app'); } catch (e) {}
      if (abrirDepois) setTimeout(abrirVLibras, 1200);
    };
    sc.onerror = function () {                       /* sem internet ou serviço fora do ar */
      if (vlibrasBox && vlibrasBox.parentNode) vlibrasBox.parentNode.removeChild(vlibrasBox);
      vlibrasBox = null;
      announce('Não foi possível carregar o tradutor de Libras. Verifique sua conexão com a internet.');
    };
    document.head.appendChild(sc);
  }
  /* Carrega depois que a página terminou de abrir, para não atrasar o site */
  if (document.readyState === 'complete') carregarVLibras(false);
  else window.addEventListener('load', function () { carregarVLibras(false); });
  getEl('botao-libras').addEventListener('click', function () { closePanel(); carregarVLibras(true); });

  /* ---------- Accessibility side panel ---------- */
  var fab = getEl('abrir-painel-acessibilidade');
  var panel = getEl('painel-acessibilidade');
  var scrim = getEl('fundo-escurecido');
  var closePanelBtn = getEl('botao-fechar-painel');
  var lastFocusedPanel = null;

  function openPanel() {
    lastFocusedPanel = document.activeElement;
    panel.classList.add('open');
    scrim.classList.add('open');
    fab.setAttribute('aria-expanded', 'true');
    closePanelBtn.focus();
  }
  function closePanel() {
    panel.classList.remove('open');
    scrim.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    if (lastFocusedPanel) lastFocusedPanel.focus(); else fab.focus();
  }
  fab.addEventListener('click', function () {
    if (panel.classList.contains('open')) closePanel(); else openPanel();
  });
  var secaoBtn = getEl('abrir-painel-pela-secao');
  if (secaoBtn) secaoBtn.addEventListener('click', openPanel);
  closePanelBtn.addEventListener('click', closePanel);
  scrim.addEventListener('click', closePanel);

  panel.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var focusables = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  getEl('botao-restaurar-padrao').addEventListener('click', function () {
    scaleIdx = 1; applyScale();
    setContrast(false, true);
    setMotion(prefersReduced, true);
    stopReading(true);
    announce('Preferências de acessibilidade restauradas ao padrão');
  });

  /* ---------- Shortcuts modal ---------- */
  var modal = getEl('janela-atalhos');
  var shortcutsBtns = [getEl('botao-atalhos')];
  var closeBtn = getEl('fechar-atalhos');
  var lastFocused = null;

  function openModal() {
    lastFocused = document.activeElement;
    closePanel();
    modal.classList.add('open');
    closeBtn.focus();
  }
  function closeModal() {
    modal.classList.remove('open');
    if (lastFocused) lastFocused.focus();
  }
  shortcutsBtns.forEach(function (b) { b.addEventListener('click', openModal); });
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  /* ---------- Mobile menu ---------- */
  var menuToggle = getEl('botao-menu');
  var mobileMenu = getEl('menu-celular');
  menuToggle.addEventListener('click', function () {
    var open = mobileMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  /* ---------- Steps interactivity ---------- */
  var stepCards = document.querySelectorAll('.step-card');
  stepCards.forEach(function (card) {
    card.addEventListener('click', function () {
      stepCards.forEach(function (c) { c.classList.remove('active'); });
      card.classList.add('active');
    });
  });

  /* ---------- Global keyboard shortcuts ---------- */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    if (e.key === 'Escape') {
      if (modal.classList.contains('open')) { closeModal(); return; }
      if (panel.classList.contains('open')) { closePanel(); return; }
    }
    if (typing) return;

    if (e.key === '?') { e.preventDefault(); openModal(); }
    else if (e.altKey && e.key === '1') { e.preventDefault(); var elInicio = document.getElementById('inicio'); if (elInicio) { elInicio.scrollIntoView(); announce('Navegando para o início'); } else { window.location.href = 'index.html#inicio'; } }
    else if (e.altKey && e.key === '2') { e.preventDefault(); var elVagas = document.getElementById('vagas'); if (elVagas) { elVagas.scrollIntoView(); announce('Navegando para vagas'); } else { window.location.href = 'vagas.html'; } }
    else if (e.altKey && e.key === '3') { e.preventDefault(); var elA11y = document.getElementById('acessibilidade'); if (elA11y) { elA11y.scrollIntoView(); announce('Navegando para acessibilidade'); } else { window.location.href = 'leis.html#acessibilidade'; } }
    else if (e.altKey && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); if (panel.classList.contains('open')) closePanel(); else openPanel(); }
    else if (e.altKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); setContrast(!body.classList.contains('high-contrast')); }
    else if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); if (speaking) stopReading(); else startReading(); }
  });
})();
