(function () {
  var body = document.body;
  var announcer = document.getElementById('announcer');

  function announce(msg) {
    announcer.textContent = '';
    setTimeout(function () { announcer.textContent = msg; }, 30);
  }
  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  /* ---------- Font scale ---------- */
  var scales = [0.9, 1, 1.15, 1.3, 1.45];
  var scaleIdx = 1;
  var savedScale = safeGet('a11y-font-scale-idx');
  if (savedScale !== null && scales[Number(savedScale)]) scaleIdx = Number(savedScale);
  var fontValue = document.getElementById('font-value');

  function applyScale() {
    document.documentElement.style.setProperty('--font-scale', scales[scaleIdx]);
    fontValue.textContent = Math.round(scales[scaleIdx] * 100) + '%';
    safeSet('a11y-font-scale-idx', scaleIdx);
  }
  applyScale();

  document.getElementById('font-inc').addEventListener('click', function () {
    scaleIdx = Math.min(scaleIdx + 1, scales.length - 1);
    applyScale();
    announce('Texto ampliado para ' + Math.round(scales[scaleIdx] * 100) + ' por cento');
  });
  document.getElementById('font-dec').addEventListener('click', function () {
    scaleIdx = Math.max(scaleIdx - 1, 0);
    applyScale();
    announce('Texto reduzido para ' + Math.round(scales[scaleIdx] * 100) + ' por cento');
  });

  /* ---------- High contrast ---------- */
  var contrastBtn = document.getElementById('btn-contrast');
  function setContrast(on, silent) {
    body.classList.toggle('high-contrast', on);
    contrastBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    safeSet('a11y-contrast', on ? '1' : '0');
    if (!silent) announce(on ? 'Alto contraste ativado' : 'Alto contraste desativado');
  }
  setContrast(safeGet('a11y-contrast') === '1', true);
  contrastBtn.addEventListener('click', function () { setContrast(!body.classList.contains('high-contrast')); });

  /* ---------- Reduced motion ---------- */
  var motionBtn = document.getElementById('btn-motion');
  function setMotion(on, silent) {
    body.classList.toggle('reduce-motion', on);
    motionBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    safeSet('a11y-motion', on ? '1' : '0');
    if (!silent) announce(on ? 'Movimento reduzido ativado' : 'Movimento reduzido desativado');
  }
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setMotion(safeGet('a11y-motion') === '1' || (safeGet('a11y-motion') === null && prefersReduced), true);
  motionBtn.addEventListener('click', function () { setMotion(!body.classList.contains('reduce-motion')); });

  /* ---------- Read aloud ---------- */
  var readBtn = document.getElementById('btn-read');
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
      var main = document.getElementById('main-content');
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

  /* ---------- Libras info ---------- */
  document.getElementById('btn-libras').addEventListener('click', function () {
    announce('Vagas com o selo Libras já têm vídeo com tradução para Língua Brasileira de Sinais. Esse recurso está em expansão para todas as vagas.');
  });

  /* ---------- Accessibility side panel ---------- */
  var fab = document.getElementById('a11y-open');
  var panel = document.getElementById('a11y-panel');
  var scrim = document.getElementById('a11y-scrim');
  var closePanelBtn = document.getElementById('a11y-close');
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
  document.getElementById('open-panel-from-section').addEventListener('click', openPanel);
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

  document.getElementById('a11y-reset').addEventListener('click', function () {
    scaleIdx = 1; applyScale();
    setContrast(false, true);
    setMotion(prefersReduced, true);
    stopReading(true);
    announce('Preferências de acessibilidade restauradas ao padrão');
  });

  /* ---------- Shortcuts modal ---------- */
  var modal = document.getElementById('shortcuts-modal');
  var shortcutsBtns = [document.getElementById('btn-shortcuts')];
  var closeBtn = document.getElementById('close-shortcuts');
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
  var menuToggle = document.getElementById('menu-toggle');
  var mobileMenu = document.getElementById('mobile-menu');
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
    var typing = tag === 'INPUT' || tag === 'TEXTAREA';

    if (e.key === 'Escape') {
      if (modal.classList.contains('open')) { closeModal(); return; }
      if (panel.classList.contains('open')) { closePanel(); return; }
    }
    if (typing) return;

    if (e.key === '?') { e.preventDefault(); openModal(); }
    else if (e.altKey && e.key === '1') { e.preventDefault(); document.getElementById('inicio').scrollIntoView(); announce('Navegando para o início'); }
    else if (e.altKey && e.key === '2') { e.preventDefault(); document.getElementById('vagas').scrollIntoView(); announce('Navegando para vagas'); }
    else if (e.altKey && e.key === '3') { e.preventDefault(); document.getElementById('acessibilidade').scrollIntoView(); announce('Navegando para acessibilidade'); }
    else if (e.altKey && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); if (panel.classList.contains('open')) closePanel(); else openPanel(); }
    else if (e.altKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); setContrast(!body.classList.contains('high-contrast')); }
    else if (e.altKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); if (speaking) stopReading(); else startReading(); }
  });
})();
