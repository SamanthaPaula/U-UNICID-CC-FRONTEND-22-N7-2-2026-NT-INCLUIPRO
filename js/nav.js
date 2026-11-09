/* ==========================================================================
   IncluiPro — nav.js : MENU ÚNICO + PORTEIRO DAS PÁGINAS
   --------------------------------------------------------------------------
   Este arquivo roda em TODAS as páginas e faz 3 coisas:
     1) Porteiro: se a página tem  <body data-protegida>  e a pessoa NÃO está
        logada, manda para entrar.html (e depois do login ela volta).
     2) Monta o menu do topo (cabeçalho) — diferente para quem está logado
        (nome, ícone de mensagens, botão Sair) e para visitantes (Entrar/Cadastrar).
     3) Esconde convites de cadastro (data-so-deslogado) de quem já tem conta.

   COMO SABEMOS QUEM ESTÁ LOGADO?
   Não há servidor. Quando alguém entra, o auth.js grava o e-mail dela em
   localStorage na chave  incluipro_session.  Aqui só conferimos se esse e-mail
   existe na lista de contas (chave  incluipro_users).
   ========================================================================== */
(function () {
  /* Lê do localStorage sem quebrar caso o navegador bloqueie o acesso */
  var S = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };

  var page = location.pathname.split('/').pop() || 'index.html';  /* ex.: "vagas.html" */
  var body = document.body, dp = body.getAttribute('data-page');   /* nome da página (data-page) */

  /* ---------- Quem é o usuário logado? ---------- */
  var email = S('incluipro_session');          /* e-mail guardado no login (ou null) */
  var users = [];
  try { users = JSON.parse(S('incluipro_users') || '[]'); } catch (e) {}   /* todas as contas criadas */
  var user = email ? users.filter(function (u) { return u.email === email; })[0] : null;
  if (!user) email = null;                     /* sessão inválida (conta apagada): trata como deslogado */

  /* ---------- 1) PORTEIRO ---------- */
  /* Página protegida + sem login => vai para o login, guardando a página de origem em ?next= */
  if (body.hasAttribute('data-protegida') && !user) {
    location.replace('entrar.html?next=' + encodeURIComponent(page + location.search));
    return;
  }
  /* Já logado não precisa ver entrar/cadastro: manda para a home */
  if (user && (dp === 'entrar' || dp === 'cadastro')) { location.replace('index.html'); return; }

  /* Troca caracteres perigosos (< > & " ') para o texto não virar HTML */
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* Links do menu: [arquivo, texto, exige login?]  (1 = exige login, 0 = livre).
     Se exige login e a pessoa está deslogada, o link vai para o login com ?next=. */
  var LINKS = [['index.html', 'Início', 0], ['painel.html', 'Meu painel', 1], ['vagas.html', 'Vagas', 1], ['empresas.html', 'Empresas', 1], ['candidaturas.html', 'Candidaturas', 1], ['leis.html', 'Leis e direitos', 1], ['como-funciona.html', 'Como funciona', 0]];
  /* Links extras que só aparecem no menu do celular */
  var EXTRA = [['mensagens.html', 'Mensagens', 1], ['perfil.html', 'Perfil', 1], ['sobre.html', 'Sobre nós', 0]];

  /* Quantas conversas não lidas o usuário tem (para o "balãozinho" vermelho) */
  function unread() {
    if (!email) return 0;
    try { return (JSON.parse(S('incluipro_msgs_' + email)) || []).filter(function (t) { return !t.lida; }).length; } catch (e) { return 0; }
  }

  /* Monta o HTML dos links. "movel" = true inclui os links extras do celular. */
  function links(movel) {
    var arr = movel ? LINKS.concat(EXTRA.filter(function (l) { return user || !l[2]; })) : LINKS;
    /* "Meu painel" só aparece para quem está logado */
    arr = arr.filter(function (l) { return l[0] !== 'painel.html' || user; });
    /* No menu do computador o logo já leva para o início, então "Início" só aparece no menu do celular
       (assim o cabeçalho logado, que tem mais itens, cabe na tela) */
    if (!movel) arr = arr.filter(function (l) { return l[0] !== 'index.html'; });
    return arr.map(function (l) {
      var href = (!user && l[2]) ? 'entrar.html?next=' + encodeURIComponent(l[0]) : l[0];
      var cur = (page === l[0] || (l[0] === 'empresas.html' && page === 'empresa.html')) ? ' aria-current="page"' : '';  /* marca a página atual */
      var badge = l[0] === 'mensagens.html' ? '<span class="badge-nav" data-badge></span>' : '';
      return '<a href="' + href + '"' + cur + '>' + l[1] + badge + '</a>';
    }).join('');
  }

  /* Nome curto e iniciais para o "avatar" redondo */
  var primeiro = user ? user.nome.split(' ')[0] : '';
  var ini = user ? (user.nome.trim().split(/\s+/).map(function (p) { return p[0]; }).slice(0, 2).join('')).toUpperCase() : '';

  var iconeMsg = function (extra) { return '<a class="icone-msg' + extra + '" href="mensagens.html"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><span class="sr-only">Mensagens</span><span class="badge-nav" data-badge></span></a>'; };

  /* Lado direito do cabeçalho: logado (perfil + mensagens + Sair) ou visitante (Entrar + Cadastrar) */
  var direita = user
    ? '<a class="user-chip" href="painel.html" aria-label="Meu painel, ' + esc(user.nome) + '"><span class="avatar-circle" aria-hidden="true">' + esc(ini) + '</span><span class="user-name">' + esc(primeiro) + '</span></a>' + iconeMsg('') + '<button type="button" class="botao-sair" data-sair>Sair</button>'
    : '<a href="entrar.html" class="btn btn-ghost">Entrar</a><a href="cadastro.html" class="btn btn-primary">Cadastrar grátis</a>';
  var movel = user ? '<button type="button" class="botao-sair" data-sair>Sair</button>'
    : '<a href="entrar.html" class="btn btn-ghost" style="text-align:center;">Entrar</a><a href="cadastro.html" class="btn btn-primary">Cadastrar grátis</a>';

  /* ---------- 2) MONTA O CABEÇALHO ---------- */
  /* O HTML de cada página tem um <header class="cabecalho"> básico; aqui ele é
     reescrito por inteiro, então o menu fica igual em todas as páginas. */
  var h = document.querySelector('header.cabecalho');
  if (h) {
    var htmlHeader =
      '<div class="wrap cabecalho-linha"><a href="index.html" class="logo"><span class="logo-icone" aria-hidden="true">i+</span><span>Inclui<span class="logo-destaque">Pro</span></span></a>' +
      '<nav class="menu-principal" aria-label="Navegação principal">' + links() + '</nav>' +
      '<div class="botoes-topo">' + direita + '</div>' +
      (user ? iconeMsg(' icone-msg-movel') : '') + '<button class="botao-menu botao-secundario" id="botao-menu" style="margin-top:0;" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-celular">☰ Menu</button></div>' +
      '<nav class="menu-celular" id="menu-celular" aria-label="Navegação móvel">' + links(true) + movel + '</nav>';
    try { h.innerHTML = htmlHeader; } catch (err) {}
    /* Botão "Sair": apaga a sessão (NÃO apaga a conta) e volta para a home */
    h.addEventListener('click', function (e) {
      if (e.target.closest('[data-sair]')) { try { localStorage.removeItem('incluipro_session'); } catch (x) {} location.href = 'index.html'; }
    });
  }

  /* Atualiza o número de mensagens não lidas no menu */
  function refresh() {
    var n = unread();
    Array.prototype.forEach.call(document.querySelectorAll('[data-badge]'), function (b) {
      b.innerHTML = n ? '<span aria-hidden="true">' + n + '</span><span class="sr-only"> ' + n + (n === 1 ? ' conversa não lida' : ' conversas não lidas') + '</span>' : '';
      b.style.display = n ? 'inline-flex' : 'none';
    });
  }

  /* ---------- 3) CONVITES DE CADASTRO ---------- */
  /* Qualquer elemento com o atributo  data-so-deslogado  (ex.: o botão
     "Criar conta grátis" em Como funciona) é REMOVIDO quando a pessoa já está logada. */
  if (user) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-so-deslogado]'), function (el) { el.parentNode.removeChild(el); });
  }

  window.IPNav = { refresh: refresh };   /* outros arquivos podem chamar IPNav.refresh() */
  refresh();

  /* Home logada: troca o convite de cadastro por atalhos úteis */
  if (user && page === 'index.html') {
    var cta = document.querySelector('.cta-banner');
    if (cta) cta.innerHTML = '<div><h2>Olá, ' + esc(primeiro) + '!</h2><p>Continue de onde parou: veja suas candidaturas e mensagens.</p></div><div class="cta-actions"><a href="vagas.html" class="btn btn-amber">Buscar vagas</a><a href="painel.html" class="btn btn-outline-light">Meu painel</a></div>';
  }
})();
