/* ==========================================================================
   IncluiPro — auth.js : CADASTRO, VERIFICAÇÃO DE E-MAIL, LOGIN
   --------------------------------------------------------------------------
   Este site é só HTML/CSS/JS estático, SEM servidor e SEM banco de dados.
   Por isso as contas ficam no  localStorage  do navegador:

     incluipro_users                  lista de contas [{nome, email, senhaHash}]
     incluipro_session                e-mail de quem está logado agora
     incluipro_pending_verification   cadastro aguardando o código do e-mail

   Consequências importantes:
     • Cada navegador/computador tem a sua própria lista de contas.
     • Se você cadastrou um e-mail para testar, ele continua "ocupado" naquele
       navegador (por isso aparece "e-mail já cadastrado"). Para recomeçar,
       abra limpar-dados-teste.html ou use F12 > Application > Local Storage.
     • A senha é guardada só com um "hash" simples (NÃO é seguro para produção).

   FLUXO DO CADASTRO:
     cadastro.html  -> valida os campos, gera um código de 6 dígitos e envia por
                       e-mail (EmailJS) ou, sem EmailJS, mostra o código na tela;
     verificar.html -> a pessoa digita o código; se estiver certo (e dentro de
                       10 min) a conta é criada em incluipro_users e ela já entra;
     entrar.html    -> login com e-mail + senha; volta para a página de onde veio
                       (parâmetro ?next=).

   Para produção de verdade, o código e as contas precisam ficar num backend
   (Supabase, Firebase Auth, Node...), nunca no navegador.
   ========================================================================== */

/* ==========================================================================
   >>> ENVIO REAL DE E-MAIL (EmailJS) — PREENCHA OS 3 CAMPOS ABAIXO <<<
   Crie a conta grátis em emailjs.com (passo a passo no LEIAME-EMAIL.md).
   Com os campos vazios o site fica em modo SIMULADO (código aparece na tela).
   ========================================================================== */
var INCLUIPRO_EMAIL = {
  serviceId: 'service_5bywu2x',           /* serviço de e-mail conectado no EmailJS */
  publicKey: 'hMnwzkTw2rwMx_DEt',          /* chave pública do EmailJS (Account > General > Public Key) — pode ficar no site */
  templateId: 'template_jdhjrrl',         /* template "Senha de uso único" = CÓDIGO DE VERIFICAÇÃO do cadastro */
  contatoTemplateId: 'template_6ek7boh',  /* template "Contate-nos" = FORMULÁRIO DE CONTATO da página Sobre */
  contatoDestino: 'samanthapaulaa@gmail.com', /* quem recebe as mensagens do formulário de contato */
  /* FormSubmit (formsubmit.co): serviço grátis, SEM cadastro, que entrega o formulário por e-mail.
     Na 1ª mensagem enviada, a Samantha recebe um e-mail de ativação em samanthapaulaa@gmail.com
     e precisa clicar em "Activate Form" UMA vez. Depois disso toda mensagem chega direto.
     (Opcional: depois de ativar, o FormSubmit dá um "código" no lugar do e-mail — cole em
     contatoAlias para esconder o e-mail do código-fonte.) */
  /* Mostra na tela o motivo técnico quando o e-mail falha (útil enquanto você configura).
     Depois que tudo estiver funcionando, troque para false. */
  modoDepuracao: true,
  contatoFormSubmit: true,
  contatoAlias: ''
};

(function () {
  /* Nomes das "gavetas" do localStorage usadas por este arquivo */
  var USERS_KEY = 'incluipro_users';
  var PENDING_KEY = 'incluipro_pending_verification';
  var SESSION_KEY = 'incluipro_session';
  var CODE_TTL_MS = 10 * 60 * 1000; /* 10 minutos */

  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }
  function safeRemove(key) { try { localStorage.removeItem(key); } catch (e) {} }

  function getUsers() {
    try { return JSON.parse(safeGet(USERS_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveUsers(list) { safeSet(USERS_KEY, JSON.stringify(list)); }
  /* Procura uma conta pelo e-mail (sem diferenciar maiúsculas). Devolve a conta ou null. */
  function findUserByEmail(email) {
    email = String(email || '').trim().toLowerCase();
    return getUsers().find(function (u) { return u.email === email; }) || null;
  }

  /* Hash simples só para não guardar a senha em texto puro no localStorage.
     NÃO é seguro para um app real — num backend de verdade use bcrypt/argon2. */
  function simpleHash(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
    return 'h' + h + '_' + btoa(unescape(encodeURIComponent(str))).slice(0, 24);
  }

  /* Sorteia o código de verificação: 6 dígitos (100000 a 999999) */
  function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function getPending() {
    try { return JSON.parse(safeGet(PENDING_KEY) || 'null'); } catch (e) { return null; }
  }
  function savePending(data) { safeSet(PENDING_KEY, JSON.stringify(data)); }
  function clearPending() { safeRemove(PENDING_KEY); }

  function getSession() { return safeGet(SESSION_KEY); }
  function setSession(email) { safeSet(SESSION_KEY, email); }
  function clearSession() { safeRemove(SESSION_KEY); }

  /* Página para voltar depois do login (só .html do próprio site) */
  function safeNext() {
    var nx = new URLSearchParams(location.search).get('next');
    return (nx && /^[a-z0-9-]+\.html(\?[^\s]*)?$/i.test(nx)) ? nx : '';
  }

  /* ---- Envio real de e-mail via EmailJS (API REST, sem instalar nada) ----
     enviarEmail(idDoTemplate, parametros) manda um e-mail usando um template
     criado no painel do EmailJS. Os "parametros" preenchem as {{variaveis}} do template. */
  function enviarEmail(templateId, params) {
    var c = INCLUIPRO_EMAIL;
    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: c.serviceId, template_id: templateId, user_id: c.publicKey, template_params: params })
    }).then(function (r) {
      if (!r.ok) {
        return r.text().then(function (t) {       /* guarda status + texto do EmailJS para explicar o motivo */
          if (window.console) console.error('EmailJS erro ' + r.status + ': ' + t);
          var err = new Error('send_failed_' + r.status); err.status = r.status; err.detalhe = t; throw err;
        });
      }
    }, function (e) {                              /* nem chegou ao EmailJS: sem internet, bloqueio de rede/extensão... */
      e.status = 0; e.detalhe = String(e && e.message || e); throw e;
    });
  }
  /* Traduz o erro do EmailJS para uma explicação em português (e, no modo depuração, mostra o detalhe técnico) */
  function explicarErroEmail(err) {
    var t = String((err && err.detalhe) || ''), st = err && err.status, dica;
    if (st === 0) dica = 'Sem conexão com o EmailJS. Verifique a internet e se algum bloqueador de anúncios/antivírus está barrando api.emailjs.com. Abrir o arquivo com duplo clique também pode causar isso: use um servidor (localhost) ou publique o site.';
    else if (/public key|user_id/i.test(t)) dica = 'A Public Key está incorreta (EmailJS > Account > General).';
    else if (/service id not found|service.*not found/i.test(t)) dica = 'O Service ID não foi encontrado nesta conta do EmailJS.';
    else if (/template id not found|template.*not found/i.test(t)) dica = 'O Template ID não foi encontrado (confira se ele pertence à mesma conta do Service ID).';
    else if (/gmail_api|invalid grant|insufficient|scope|authentication/i.test(t)) dica = 'O Gmail conectado ao EmailJS perdeu a autorização. Em EmailJS > Email Services, abra o serviço, clique em Reconnect e MARQUE a permissão "Send email on your behalf".';
    else if (/recipients? address is empty/i.test(t)) dica = 'O campo "To Email" do template está vazio. Preencha-o no EmailJS (no contato: samanthapaulaa@gmail.com; no código: {{email}}).';
    else if (/origin|non-browser|domain/i.test(t) || st === 403) dica = 'O EmailJS bloqueou esta origem. Em EmailJS > Account > Security, adicione o endereço do site em "Allowed origins" (ou deixe vazio durante os testes).';
    else if (st === 429) dica = 'Muitos envios em pouco tempo. Aguarde um minuto.';
    else if (st === 400) dica = 'O EmailJS recusou os dados enviados. Confira o template (variáveis e campos obrigatórios).';
    else dica = 'Erro inesperado ao enviar.';
    return dica + (INCLUIPRO_EMAIL.modoDepuracao ? '  [Detalhe técnico: ' + (st === 0 ? 'rede' : 'HTTP ' + st) + (t ? ' — ' + t.slice(0, 160) : '') + ']' : '');
  }
  /* O e-mail real só funciona se a chave, o serviço e o template estiverem preenchidos */
  function emailConfigured(templateId) {
    var c = INCLUIPRO_EMAIL;
    return !!(c.serviceId && c.publicKey && (templateId === undefined ? c.templateId : templateId));
  }
  /* E-mail com o código de 6 dígitos do cadastro */
  function sendCodeEmail(pending) {
    return enviarEmail(INCLUIPRO_EMAIL.templateId, {
      /* Variáveis que o template "Senha de uso único" do EmailJS usa: {{passcode}}, {{time}}, {{email}} */
      email: pending.email,                 /* para quem vai o e-mail */
      passcode: pending.code,               /* o código de 6 dígitos */
      time: new Date(pending.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),  /* hora em que o código vence */
      /* nomes extras, caso você personalize o template */
      to_email: pending.email, to_name: pending.nome, name: pending.nome, code: pending.code,
      expires_min: String(CODE_TTL_MS / 60000), app_name: 'IncluiPro'
    });
  }
  /* Deixa o envio disponível para outras páginas (o formulário de contato usa isto) */
  window.IPEmail = { config: INCLUIPRO_EMAIL, pronto: emailConfigured, enviar: enviarEmail, explicar: explicarErroEmail };

  /* Confere se o e-mail tem o formato nome@dominio.com */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function passwordStrength(pw) {
    var score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 4);
  }

  function showStatus(el, type, msg) {
    if (!el) return;
    el.className = 'form-status show status-' + type;
    el.textContent = msg;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  }
  function hideStatus(el) {
    if (!el) return;
    el.className = 'form-status';
    el.textContent = '';
  }

  function setFieldError(group, errorEl, input, msg) {
    if (msg) {
      group.classList.add('has-error');
      if (errorEl) errorEl.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
    } else {
      group.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      input.removeAttribute('aria-invalid');
    }
  }

  function announce(msg) {
    var announcer = document.getElementById('announcer');
    if (!announcer) return;
    announcer.textContent = '';
    setTimeout(function () { announcer.textContent = msg; }, 30);
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  /* ---------------------------------------------------------------------
     Página: cadastro.html
     --------------------------------------------------------------------- */
  /* Tela de cadastro: valida nome/e-mail/senha, guarda o cadastro como "pendente"
     e envia o código para o e-mail (ou mostra na tela no modo simulado). */
  function initCadastro() {
    var form = document.getElementById('form-cadastro');
    if (!form) return;
    var status = document.getElementById('cadastro-status');

    var pwInput = document.getElementById('cad-senha');
    var pwToggle = document.getElementById('toggle-senha');
    var strengthBar = document.getElementById('pw-strength');
    if (pwInput && strengthBar) {
      pwInput.addEventListener('input', function () {
        strengthBar.setAttribute('data-level', String(passwordStrength(pwInput.value)));
      });
    }
    if (pwToggle && pwInput) {
      pwToggle.addEventListener('click', function () {
        var show = pwInput.type === 'password';
        pwInput.type = show ? 'text' : 'password';
        pwToggle.textContent = show ? 'Ocultar' : 'Mostrar';
        pwToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideStatus(status);

      var nome = document.getElementById('cad-nome');
      var email = document.getElementById('cad-email');
      var senha = document.getElementById('cad-senha');
      var confirmar = document.getElementById('cad-confirmar');

      var nomeVal = nome.value.trim();
      var emailVal = email.value.trim().toLowerCase();
      var senhaVal = senha.value;
      var confirmarVal = confirmar.value;
      var ok = true;

      setFieldError(nome.closest('.form-group'), document.getElementById('err-nome'), nome,
        nomeVal.length < 2 ? (ok = false, 'Digite seu nome completo.') : '');
      setFieldError(email.closest('.form-group'), document.getElementById('err-email'), email,
        !isValidEmail(emailVal) ? (ok = false, 'Digite um e-mail válido.') : '');
      setFieldError(senha.closest('.form-group'), document.getElementById('err-senha'), senha,
        senhaVal.length < 8 ? (ok = false, 'A senha precisa ter no mínimo 8 caracteres.') : '');
      setFieldError(confirmar.closest('.form-group'), document.getElementById('err-confirmar'), confirmar,
        confirmarVal !== senhaVal ? (ok = false, 'As senhas não coincidem.') : '');

      if (!ok) {
        showStatus(status, 'error', 'Verifique os campos destacados abaixo.');
        announce('Há erros no formulário de cadastro.');
        var firstError = form.querySelector('.has-error input');
        if (firstError) firstError.focus();
        return;
      }

      if (findUserByEmail(emailVal)) {
        showStatus(status, 'error', 'Já existe uma conta com este e-mail. Tente entrar em vez de cadastrar.');
        announce('E-mail já cadastrado.');
        email.focus();
        return;
      }

      var pendingData = {
        nome: nomeVal,
        email: emailVal,
        senhaHash: simpleHash(senhaVal),
        code: generateCode(),
        expiresAt: Date.now() + CODE_TTL_MS,
        attempts: 0,
        next: safeNext()
      };
      savePending(pendingData);

      function goVerify() { window.location.href = 'verificar.html'; }

      if (!emailConfigured()) {
        showStatus(status, 'success', 'Quase lá! (modo simulado) Gerando código de 6 dígitos para ' + emailVal + '.');
        announce('Cadastro validado, redirecionando para verificação de e-mail.');
        setTimeout(goVerify, 700);
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var btnTxt = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando código…'; }
      showStatus(status, 'info', 'Enviando o código para ' + emailVal + '…');
      announce('Enviando o código de verificação por e-mail.');

      sendCodeEmail(pendingData).then(function () {
        showStatus(status, 'success', 'Código enviado! Confira a caixa de entrada (e o spam) de ' + emailVal + '.');
        announce('Código enviado por e-mail.');
        setTimeout(goVerify, 900);
      }).catch(function (err) {
        clearPending();
        if (btn) { btn.disabled = false; btn.textContent = btnTxt; }
        showStatus(status, 'error', 'Não conseguimos enviar o e-mail. ' + explicarErroEmail(err));
        announce('Falha ao enviar o e-mail de verificação.');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Página: verificar.html
     --------------------------------------------------------------------- */
  /* Tela do código: confere os 6 dígitos. Acertou => cria a conta em incluipro_users,
     abre a sessão (incluipro_session) e leva a pessoa para a página que ela queria. */
  function initVerificar() {
    var wrap = document.getElementById('verify-wrap');
    if (!wrap) return;
    var status = document.getElementById('verify-status');
    var pending = getPending();
    var noPending = document.getElementById('no-pending');
    var emailTarget = document.getElementById('verify-email-target');
    var demoCode = document.getElementById('demo-code');

    if (!pending) {
      wrap.style.display = 'none';
      if (noPending) noPending.style.display = 'block';
      return;
    }

    if (emailTarget) emailTarget.textContent = pending.email;
    var demoBox = document.querySelector('.demo-email-box');
    if (demoBox && emailConfigured()) demoBox.style.display = 'none';
    if (demoCode && !emailConfigured()) demoCode.textContent = pending.code.split('').join(' ');

    var inputs = Array.prototype.slice.call(document.querySelectorAll('.code-inputs input'));
    inputs.forEach(function (inp, idx) {
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 1);
        if (inp.value && inputs[idx + 1]) inputs[idx + 1].focus();
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !inp.value && inputs[idx - 1]) inputs[idx - 1].focus();
      });
      inp.addEventListener('paste', function (e) {
        var text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
        if (!text) return;
        e.preventDefault();
        text.split('').slice(0, inputs.length).forEach(function (ch, i) {
          if (inputs[i]) inputs[i].value = ch;
        });
        var last = inputs[Math.min(text.length, inputs.length) - 1];
        if (last) last.focus();
      });
    });

    var form = document.getElementById('form-verificar');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideStatus(status);

      var current = getPending();
      if (!current) {
        showStatus(status, 'error', 'A verificação expirou. Cadastre-se novamente.');
        return;
      }
      if (Date.now() > current.expiresAt) {
        showStatus(status, 'error', 'Esse código expirou. Clique em "Reenviar código".');
        announce('Código expirado.');
        return;
      }

      var typed = inputs.map(function (inp) { return inp.value; }).join('');
      if (typed.length < 6) {
        showStatus(status, 'error', 'Digite os 6 dígitos do código.');
        announce('Código incompleto.');
        return;
      }

      if (typed !== current.code) {
        current.attempts = (current.attempts || 0) + 1;
        savePending(current);
        showStatus(status, 'error', 'Código incorreto. Verifique e tente novamente.');
        announce('Código incorreto.');
        inputs.forEach(function (inp) { inp.value = ''; });
        inputs[0].focus();
        return;
      }

      var users = getUsers();
      users.push({
        nome: current.nome,
        email: current.email,
        senhaHash: current.senhaHash,
        verificado: true,
        criadoEm: new Date().toISOString()
      });
      saveUsers(users);
      clearPending();
      setSession(current.email);

      showStatus(status, 'success', 'E-mail confirmado! Redirecionando para o seu painel…');
      announce('E-mail confirmado com sucesso.');
      setTimeout(function () { window.location.href = current.next || 'index.html'; }, 600);
    });

    var resendBtn = document.getElementById('resend-code');
    var resendTimer = null, cooldown = 0;
    function tickCooldown() {
      cooldown--;
      if (cooldown <= 0) {
        clearInterval(resendTimer);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Reenviar código';
      } else {
        resendBtn.textContent = 'Reenviar código (' + cooldown + 's)';
      }
    }
    function startCooldown() {
      resendBtn.disabled = true;
      cooldown = 30;
      resendBtn.textContent = 'Reenviar código (' + cooldown + 's)';
      resendTimer = setInterval(tickCooldown, 1000);
    }
    resendBtn.addEventListener('click', function () {
      var current = getPending();
      if (!current) return;
      current.code = generateCode();
      current.expiresAt = Date.now() + CODE_TTL_MS;
      current.attempts = 0;
      savePending(current);
      inputs.forEach(function (inp) { inp.value = ''; });
      inputs[0].focus();

      if (!emailConfigured()) {
        if (demoCode) demoCode.textContent = current.code.split('').join(' ');
        showStatus(status, 'info', 'Novo código (simulado) gerado para ' + current.email + '.');
        announce('Novo código gerado.');
        startCooldown();
        return;
      }
      resendBtn.disabled = true;
      showStatus(status, 'info', 'Enviando um novo código…');
      sendCodeEmail(current).then(function () {
        showStatus(status, 'success', 'Enviamos um novo código para ' + current.email + '. Confira também o spam.');
        announce('Novo código enviado por e-mail.');
        startCooldown();
      }).catch(function (err) {
        resendBtn.disabled = false;
        showStatus(status, 'error', 'Não conseguimos reenviar. ' + explicarErroEmail(err));
        announce('Falha ao reenviar o e-mail.');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Página: entrar.html
     --------------------------------------------------------------------- */
  /* Tela de login: procura a conta pelo e-mail, compara o hash da senha e,
     se estiver certo, grava a sessão e volta para a página de origem (?next=). */
  function initEntrar() {
    var form = document.getElementById('form-entrar');
    if (!form) return;
    var status = document.getElementById('entrar-status');

    var destino = safeNext();
    if (destino) {
      showStatus(status, 'info', 'Para ver vagas, empresas e leis, entre na sua conta ou cadastre-se grátis.');
      Array.prototype.forEach.call(document.querySelectorAll('a[href="cadastro.html"]'), function (a) {
        a.setAttribute('href', 'cadastro.html?next=' + encodeURIComponent(destino));
      });
    }

    var pwInput = document.getElementById('login-senha');
    var pwToggle = document.getElementById('toggle-login-senha');
    if (pwToggle && pwInput) {
      pwToggle.addEventListener('click', function () {
        var show = pwInput.type === 'password';
        pwInput.type = show ? 'text' : 'password';
        pwToggle.textContent = show ? 'Ocultar' : 'Mostrar';
        pwToggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideStatus(status);

      var email = document.getElementById('login-email');
      var senha = document.getElementById('login-senha');
      var emailVal = email.value.trim().toLowerCase();
      var senhaVal = senha.value;

      setFieldError(email.closest('.form-group'), document.getElementById('err-login-email'), email,
        !isValidEmail(emailVal) ? 'Digite um e-mail válido.' : '');
      setFieldError(senha.closest('.form-group'), document.getElementById('err-login-senha'), senha,
        senhaVal.length === 0 ? 'Digite sua senha.' : '');

      if (!isValidEmail(emailVal) || senhaVal.length === 0) {
        showStatus(status, 'error', 'Verifique os campos destacados abaixo.');
        announce('Há erros no formulário de login.');
        return;
      }

      var user = findUserByEmail(emailVal);
      if (!user) {
        showStatus(status, 'error', 'Não encontramos uma conta com este e-mail. Que tal se cadastrar?');
        announce('Conta não encontrada.');
        return;
      }
      if (user.senhaHash !== simpleHash(senhaVal)) {
        showStatus(status, 'error', 'E-mail ou senha incorretos.');
        announce('E-mail ou senha incorretos.');
        return;
      }

      setSession(user.email);
      showStatus(status, 'success', 'Login realizado! Redirecionando…');
      announce('Login realizado com sucesso.');
      setTimeout(function () { window.location.href = safeNext() || 'index.html'; }, 500);
    });
  }

  /* ---------------------------------------------------------------------
     Página: painel.html
     --------------------------------------------------------------------- */
  function initPainel() {
    var root = document.getElementById('panel-root');
    if (!root) return;

    var email = getSession();
    var user = email ? findUserByEmail(email) : null;
    if (!user) {
      window.location.href = 'entrar.html';
      return;
    }

    var nameEls = document.querySelectorAll('[data-user-name]');
    nameEls.forEach(function (el) { el.textContent = user.nome.split(' ')[0]; });
    var fullNameEls = document.querySelectorAll('[data-user-fullname]');
    fullNameEls.forEach(function (el) { el.textContent = user.nome; });
    var emailEls = document.querySelectorAll('[data-user-email]');
    emailEls.forEach(function (el) { el.textContent = user.email; });
    var avatarEls = document.querySelectorAll('[data-user-avatar]');
    avatarEls.forEach(function (el) { el.textContent = initials(user.nome); });

    var logoutBtns = document.querySelectorAll('#botao-sair, #botao-sair-mobile');
    logoutBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        clearSession();
        window.location.href = 'index.html';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.getAttribute('data-page');
    if (page === 'cadastro') initCadastro();
    else if (page === 'verificar') initVerificar();
    else if (page === 'entrar') initEntrar();
    else if (page === 'painel') initPainel();
  });
})();
