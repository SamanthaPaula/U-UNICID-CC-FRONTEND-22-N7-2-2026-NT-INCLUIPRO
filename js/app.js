/* ==========================================================================
   IncluiPro — app.js : VAGAS, CANDIDATURAS, MENSAGENS E DADOS COMPARTILHADOS
   --------------------------------------------------------------------------
   • JOBS            lista fixa das 8 vagas de demonstração (não há banco de dados)
   • localStorage    tudo que o usuário faz fica no navegador, em chaves como:
                       incluipro_perfil_<email>   perfil/currículo (ver perfil.js)
                       incluipro_cands_<email>    candidaturas enviadas
                       incluipro_salvas_<email>   vagas salvas
                       incluipro_msgs_<email>     conversas com as empresas
   • window.IP       "caixa de ferramentas" que outros arquivos (perfil.js,
                     paginas.js) usam: IP.JOBS, IP.esc, IP.J, IP.W, IP.say...
   • Logos           veja logoFontes(): img/empresas/*.png -> ícone do site -> letra
   • A página Perfil fica em js/perfil.js
   ========================================================================== */
(function () {
  'use strict';
  /* Atalhos usados no arquivo todo:
     $(id)   = pega um elemento da página pelo id
     S / W   = lê / grava texto no localStorage (sem quebrar se o navegador bloquear)
     J(k,d)  = lê um JSON do localStorage (ou devolve o padrão d)
     esc()   = deixa um texto seguro para colocar em HTML
     say()   = avisa leitores de tela */
  var $ = function (id) { return document.getElementById(id); };
  var S = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var W = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var J = function (k, d) { try { return JSON.parse(S(k)) || d; } catch (e) { return d; } };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return 'R$ ' + n.toLocaleString('pt-BR'); };
  var say = function (m) { var a = $('announcer'); if (!a) return; a.textContent = ''; setTimeout(function () { a.textContent = m; }, 30); };

  var email = S('incluipro_session');
  var PK = 'incluipro_perfil_' + email, CK = 'incluipro_cands_' + email;

  var FEAT = { libras: 'Intérprete de Libras', leitor: 'Sistemas compatíveis com leitor de tela', fisica: 'Acessibilidade física (rampa, elevador, banheiro adaptado)', assist: 'Tecnologia assistiva fornecida pela empresa', flex: 'Horário flexível', remoto: 'Trabalho remoto', calmo: 'Ambiente de baixa estimulação sensorial', legenda: 'Reuniões com legenda ao vivo' };
  var SHORT = { libras: 'Libras', leitor: 'Leitor de tela', fisica: 'Acessibilidade física', assist: 'Tec. assistiva', flex: 'Horário flexível', remoto: 'Remoto', calmo: 'Ambiente calmo', legenda: 'Legenda ao vivo' };
  var PCD = { visual: 'Deficiência visual', auditiva: 'Deficiência auditiva / surdez', fisica: 'Deficiência física', intelectual: 'Deficiência intelectual', autismo: 'Autismo (TEA)', multipla: 'Deficiência múltipla' };
  var ADAPT = { libras: 'Intérprete de Libras na entrevista', tempo: 'Tempo extra em testes', formato: 'Materiais em formato acessível (leitor de tela, fonte ampliada)', texto: 'Entrevista por texto ou chat', legenda: 'Videochamada com legenda', local: 'Local de entrevista acessível', pausa: 'Pausas e ambiente calmo' };
  var COMM = { texto: 'Texto ou e-mail', libras: 'Libras (vídeo)', voz: 'Voz ou telefone' };
  var ETAPAS = ['Enviada', 'Em análise', 'Entrevista', 'Resultado'];
  var MODOS = ['Remoto', 'Híbrido', 'Presencial'];

  var JOBS = [
    { id: 1, emp: 'Nubank', cor: '#0E4433', titulo: 'Analista de Dados Pleno', tipo: 'CLT', modo: 'Remoto', local: 'São Paulo, SP', sal: [7000, 9000], dias: 2, pcd: ['visual', 'auditiva', 'fisica', 'autismo'], feat: ['leitor', 'remoto', 'flex', 'legenda', 'assist'], tags: ['SQL', 'Python'], desc: 'Transforme dados em decisões para o time de produto, com dashboards e análises acessíveis.' },
    { id: 2, emp: 'iFood', cor: '#23875F', titulo: 'UX Designer', tipo: 'CLT', modo: 'Híbrido', local: 'Campinas, SP', sal: [6500, 8500], dias: 5, pcd: ['auditiva', 'fisica', 'autismo', 'intelectual'], feat: ['libras', 'legenda', 'fisica', 'flex', 'calmo'], tags: ['Figma', 'Pesquisa'], desc: 'Desenhe jornadas para milhões de usuários e participe de testes de usabilidade com pessoas com deficiência.' },
    { id: 3, emp: 'Totvs', cor: '#145C43', titulo: 'Desenvolvedor(a) Front-end', tipo: 'CLT', modo: 'Remoto', local: 'Nacional', sal: [8000, 11000], dias: 1, pcd: ['visual', 'auditiva', 'fisica', 'multipla'], feat: ['leitor', 'assist', 'remoto', 'flex', 'legenda'], tags: ['React', 'TypeScript'], desc: 'Construa interfaces em React seguindo WCAG, em um time que usa leitor de tela no dia a dia.' },
    { id: 4, emp: 'Ambev', cor: '#2F9E6F', titulo: 'Coordenador(a) de Logística', tipo: 'CLT', modo: 'Presencial', local: 'Jaguariúna, SP', sal: [9000, 12000], dias: 9, pcd: ['fisica', 'auditiva'], feat: ['fisica', 'libras', 'assist'], tags: ['Logística', 'Gestão'], desc: 'Coordene a operação de distribuição em unidade com rampas, elevadores e banheiros adaptados.' },
    { id: 5, emp: 'Vivo', cor: '#0E4433', titulo: 'Atendimento ao Cliente', tipo: 'CLT', modo: 'Remoto', local: 'Nacional', sal: [2100, 2600], dias: 3, pcd: ['visual', 'auditiva', 'fisica', 'intelectual', 'autismo'], feat: ['remoto', 'leitor', 'libras', 'flex', 'calmo', 'assist'], tags: ['Comunicação'], desc: 'Atenda clientes por chat com ferramentas compatíveis com leitores de tela e treinamento completo.' },
    { id: 6, emp: 'Itaú', cor: '#145C43', titulo: 'Assistente Administrativo', tipo: 'CLT', modo: 'Híbrido', local: 'São Paulo, SP', sal: [2600, 3100], dias: 6, pcd: ['fisica', 'intelectual', 'autismo', 'multipla'], feat: ['fisica', 'flex', 'calmo', 'assist'], tags: ['Excel', 'Rotinas'], desc: 'Apoie rotinas administrativas com tarefas bem definidas e acompanhamento de um mentor.' },
    { id: 7, emp: 'Magazine Luiza', cor: '#23875F', titulo: 'Analista de Suporte Técnico', tipo: 'CLT', modo: 'Híbrido', local: 'Franca, SP', sal: [3400, 4200], dias: 4, pcd: ['auditiva', 'fisica', 'visual'], feat: ['libras', 'legenda', 'leitor', 'fisica'], tags: ['Suporte', 'Redes'], desc: 'Resolva chamados internos com time que se comunica em Libras e por texto.' },
    { id: 8, emp: 'Mercado Livre', cor: '#2F9E6F', titulo: 'Analista de Conteúdo', tipo: 'PJ', modo: 'Remoto', local: 'Nacional', sal: [4000, 5500], dias: 7, pcd: ['visual', 'auditiva', 'fisica', 'autismo', 'multipla'], feat: ['remoto', 'flex', 'leitor', 'legenda', 'calmo'], tags: ['Conteúdo', 'SEO'], desc: 'Escreva e revise conteúdo de produtos, com prazos flexíveis e comunicação assíncrona.' }
  ];
  var slug = function (n) { return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); };
  var empLink = function (j) { return '<a href="empresa.html?id=' + slug(j.emp) + '">' + esc(j.emp) + '</a>'; };
  /* ---------------------------------------------------------------------
     LOGOS DAS EMPRESAS
     Cada empresa tenta, nesta ordem:
       1) um arquivo seu em  img/empresas/<id-da-empresa>.png  (ex.: img/empresas/nubank.png)
       2) o maior ícone do site da empresa (serviço icon.horse, ~180px, nítido)
       3) o favicon do Google (256px)
       4) img/empresas/<id>.svg — arquivo provisório já incluído no projeto (funciona offline)
       5) a letra inicial (como era antes) se tudo falhar
     Para usar a logo oficial em alta qualidade, basta colocar o PNG na pasta img/empresas/.
     --------------------------------------------------------------------- */
  var DOMINIOS = { 'Nubank': 'nubank.com.br', 'iFood': 'ifood.com.br', 'Totvs': 'totvs.com', 'Ambev': 'ambev.com.br', 'Itaú': 'itau.com.br', 'Magazine Luiza': 'magazineluiza.com.br', 'Mercado Livre': 'mercadolivre.com.br', 'Vivo': 'vivo.com.br' };
  function logoFontes(nome) {
    var id = slug(nome);
    var f = ['img/empresas/' + id + '.png'];                 /* 1) logo oficial que VOCÊ colocar na pasta */
    if (DOMINIOS[nome]) {
      /* 2) icon.horse escolhe o MAIOR ícone do site (inclusive o "touch icon" de 180px, nítido) */
      f.push('https://icon.horse/icon/' + DOMINIOS[nome]);
      /* 3) favicon do Google (256px) */
      f.push('https://www.google.com/s2/favicons?domain=' + DOMINIOS[nome] + '&sz=256');
    }
    f.push('img/empresas/' + id + '.svg');                   /* 4) arquivo provisório que já vem no projeto (funciona sem internet) */
    return f;                                                /* 5) se tudo falhar, aparece a letra inicial */
  }
  /* Devolve o <img> da logo (ou só a letra, se a empresa não tiver fontes) */
  function logoConteudo(nome) {
    var f = logoFontes(nome);
    return '<img src="' + f[0] + '" data-logo="' + esc(nome) + '" data-i="0" alt="" loading="lazy">';
  }
  /* Se uma imagem falhar ao carregar, tenta a próxima fonte; no fim volta para a letra */
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.hasAttribute('data-logo')) return;
    var nome = img.getAttribute('data-logo'), i = Number(img.getAttribute('data-i')) + 1, f = logoFontes(nome);
    if (f[i]) { img.setAttribute('data-i', i); img.src = f[i]; }
    else { var box = img.parentNode; box.classList.remove('tem-img'); box.textContent = nome[0]; }
  }, true);
  /* Troca a letra por logo em blocos que já vêm escritos no HTML (home e painel) */
  function aplicarLogos() {
    Array.prototype.forEach.call(document.querySelectorAll('.job-top'), function (top) {
      var box = top.querySelector('.job-logo'), nome = top.querySelector('.job-company');
      if (!box || !nome || box.querySelector('img')) return;
      var n = nome.textContent.trim();
      if (!DOMINIOS[n]) return;
      box.classList.add('tem-img'); box.innerHTML = logoConteudo(n);
    });
  }
  var byId = function (id) { return JOBS.filter(function (j) { return j.id === Number(id); })[0]; };

  var perfil = J(PK, { pcd: [], needs: [], comm: '', area: '', cidade: '' });
  var cands = J(CK, []);
  var SK = 'incluipro_salvas_' + email, MK = 'incluipro_msgs_' + email;
  var salvas = J(SK, []), msgs = J(MK, null);
  perfil = Object.assign({ telefone: '', resumo: '', escolaridade: '', cv: null }, perfil);
  var nextUrl = function () { return encodeURIComponent(location.pathname.split('/').pop() + location.search); };

  function saveMsgs() { W(MK, JSON.stringify(msgs)); if (window.IPNav) window.IPNav.refresh(); }
  function thread(id) { return msgs.filter(function (t) { return t.id === id; })[0]; }
  function pushMsg(id, base, texto, de) {
    var t = thread(id);
    if (!t) { t = Object.assign({ id: id, msgs: [], lida: false }, base); msgs.unshift(t); }
    t.msgs.push({ de: de, texto: texto, q: Date.now() });
    t.ult = Date.now();
    if (de === 'emp') t.lida = false;
    return t;
  }
  function faltando() {
    var m = [];
    if (!perfil.telefone) m.push('Telefone');
    if (!perfil.cidade) m.push('Endereço (CEP)');
    if (!perfil.area) m.push('Área ou cargo de interesse');
    if (!perfil.cv) m.push('Currículo (arquivo PDF ou Word)');
    if ((perfil.pcd || []).length && !perfil.laudo) m.push('Laudo médico em PDF');
    return m;
  }
  /* Demonstração: sem servidor, as etapas avançam sozinhas com o tempo (a cada 2 min, até Entrevista) */
  function sync() {
    if (!email) return;
    if (msgs === null) {
      msgs = [];
      pushMsg('bv', { emp: 'Equipe IncluiPro', cor: '#145C43', assunto: 'Bem-vindo(a) à IncluiPro' }, 'Olá! Para se candidatar, complete seu perfil e envie seu currículo na aba Perfil. Se precisar de adaptações, registre por lá: as empresas só veem o que você escolher compartilhar.', 'emp');
    }
    cands.forEach(function (c) {
      var j = byId(c.jobId); if (c.arq || !j) return;
      var alvo = Math.min(2, Math.floor((Date.now() - new Date(c.data).getTime()) / 120000));
      if (alvo > c.stage) {
        c.stage = alvo;
        pushMsg('j' + j.id, { jobId: j.id, emp: j.emp, cor: j.cor, assunto: 'Candidatura: ' + j.titulo },
          alvo === 1 ? 'Seu currículo está em análise pela nossa equipe.' : 'Gostamos do seu perfil! Queremos agendar uma entrevista. Quais horários funcionam para você? As adaptações que você pediu já estão registradas.', 'emp');
      }
    });
    W(CK, JSON.stringify(cands)); saveMsgs();
  }
  function saveBtn(j) {
    var on = salvas.indexOf(j.id) > -1;
    return '<button type="button" class="botao-secundario btn-salvar" data-salvar="' + j.id + '" aria-pressed="' + on + '" aria-label="Salvar vaga ' + esc(j.titulo) + '">' + (on ? '★ Salva' : '☆ Salvar') + '</button>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-salvar]'); if (!b) return;
    if (!email) { location.href = 'entrar.html?next=' + nextUrl(); return; }
    var id = Number(b.getAttribute('data-salvar')), i = salvas.indexOf(id);
    if (i > -1) salvas.splice(i, 1); else salvas.push(id);
    W(SK, JSON.stringify(salvas));
    var on = salvas.indexOf(id) > -1;
    Array.prototype.forEach.call(document.querySelectorAll('[data-salvar="' + id + '"]'), function (x) { x.setAttribute('aria-pressed', on); x.textContent = on ? '★ Salva' : '☆ Salvar'; });
    say(on ? 'Vaga salva.' : 'Vaga removida das salvas.');
    if (window.__rerender) window.__rerender();
  });

  function compat(j) {
    var n = perfil.needs || [];
    if (!n.length) return null;
    return { ok: n.filter(function (x) { return j.feat.indexOf(x) > -1; }).length, total: n.length };
  }
  function compatHTML(j) {
    var c = compat(j);
    if (!c) return '';
    var full = c.ok === c.total;
    return '<p class="compat' + (full ? ' compat-total' : '') + '"><span aria-hidden="true">' + (full ? '✔' : '◐') + '</span> Atende ' + c.ok + ' de ' + c.total + ' das suas adaptações' + (full ? ' (compatibilidade total)' : '') + '</p>';
  }
  function cardHTML(j, asLink) {
    var act = asLink
      ? '<a class="btn btn-ghost" href="vagas.html?vaga=' + j.id + '" aria-label="Ver detalhes da vaga ' + esc(j.titulo) + ' na ' + esc(j.emp) + '">Ver detalhes</a>'
      : '<button type="button" class="btn btn-ghost" data-abrir="' + j.id + '" aria-label="Ver detalhes da vaga ' + esc(j.titulo) + ' na ' + esc(j.emp) + '">Ver detalhes</button>';
    return '<article class="job-card"><div class="job-top"><span class="job-logo tem-img" style="background:' + j.cor + ';" aria-hidden="true">' + logoConteudo(j.emp) + '</span>' +
      '<div><div class="job-company">' + empLink(j) + '</div><h3 class="job-title">' + esc(j.titulo) + '</h3></div><span class="job-type">' + j.modo + '</span></div>' +
      '<div class="job-meta"><span>' + esc(j.local) + ' · ' + j.tipo + '</span><span class="salary">' + money(j.sal[0]) + ' – ' + money(j.sal[1]).replace('R$ ', '') + '</span></div>' +
      compatHTML(j) +
      '<div class="job-tags">' + j.feat.slice(0, 4).map(function (f) { return '<span class="tag">' + SHORT[f] + '</span>'; }).join('') + '<span class="apply acoes">' + saveBtn(j) + act + '</span></div></article>';
  }
  function checks(name, map, sel, idPrefix) {
    return Object.keys(map).map(function (k) {
      var id = idPrefix + '-' + k;
      return '<div class="check-row"><input type="checkbox" id="' + id + '" name="' + name + '" value="' + k + '"' + (sel && sel.indexOf(k) > -1 ? ' checked' : '') + '><label for="' + id + '">' + map[k] + '</label></div>';
    }).join('');
  }

  /* ---------------- Página de vagas ---------------- */
  function initVagas() {
    var list = $('lista-vagas'), modal = $('janela-vaga'), box = $('vaga-conteudo'), lastFocus = null;
    var q = $('q');
    var params = new URLSearchParams(location.search);
    if (params.get('q')) q.value = params.get('q');
    $('f-pcd').innerHTML = checks('pcd', PCD, [], 'fp');
    $('f-feat').innerHTML = checks('feat', FEAT, [], 'ff');
    $('f-modo').innerHTML = checks('modo', (function () { var o = {}; MODOS.forEach(function (m) { o[m] = m; }); return o; })(), [], 'fm');
    if (compat(JOBS[0])) $('ordem').value = 'compat';

    function vals(name) { return Array.prototype.map.call(document.querySelectorAll('#filtros input[name="' + name + '"]:checked'), function (i) { return i.value; }); }
    function render() {
      var t = q.value.trim().toLowerCase(), fp = vals('pcd'), ff = vals('feat'), fm = vals('modo');
      var r = JOBS.filter(function (j) {
        var txt = (j.emp + ' ' + j.titulo + ' ' + j.tags.join(' ')).toLowerCase();
        return (!t || txt.indexOf(t) > -1) &&
          (!fp.length || fp.some(function (p) { return j.pcd.indexOf(p) > -1; })) &&
          ff.every(function (f) { return j.feat.indexOf(f) > -1; }) &&
          (!fm.length || fm.indexOf(j.modo) > -1);
      });
      var o = $('ordem').value;
      r.sort(function (a, b) {
        if (o === 'salario') return b.sal[1] - a.sal[1];
        if (o === 'recentes') return a.dias - b.dias;
        var ca = compat(a), cb = compat(b);
        return (cb ? cb.ok / cb.total : 0) - (ca ? ca.ok / ca.total : 0) || a.dias - b.dias;
      });
      list.innerHTML = r.length ? r.map(function (j) { return cardHTML(j, false); }).join('') :
        '<div class="panel-card"><h2>Nenhuma vaga com esses filtros</h2><p>Remova alguma adaptação ou tipo de deficiência para ver mais resultados.</p><button type="button" class="botao-secundario" data-limpar>Limpar filtros</button></div>';
      $('contagem').textContent = r.length + (r.length === 1 ? ' vaga encontrada' : ' vagas encontradas');
    }
    $('filtros').addEventListener('change', render);
    $('ordem').addEventListener('change', render);
    q.addEventListener('input', render);
    $('form-busca').addEventListener('submit', function (e) { e.preventDefault(); render(); });
    function limpar() { $('filtros').reset(); q.value = ''; render(); say('Filtros removidos'); }
    $('limpar-filtros').addEventListener('click', limpar);
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-abrir]'), l = e.target.closest('[data-limpar]');
      if (b) abrir(b.getAttribute('data-abrir'), b);
      if (l) limpar();
    });

    function fechar() { modal.classList.remove('open'); if (lastFocus) lastFocus.focus(); }
    modal.addEventListener('click', function (e) { if (e.target === modal) fechar(); });
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.stopPropagation(); fechar(); }
      if (e.key !== 'Tab') return;
      var f = modal.querySelectorAll('button, a[href], input, textarea, select');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }, true);

    function abrir(id, trigger) {
      var j = byId(id); if (!j) return;
      lastFocus = trigger || document.activeElement;
      var jaCand = cands.filter(function (c) { return c.jobId === j.id; })[0];
      var topAct = jaCand
        ? '<p class="form-status show status-success" role="status" style="margin:0">✔ Você se candidatou em ' + new Date(jaCand.data).toLocaleDateString('pt-BR') + '. <a href="candidaturas.html"><u>Ver candidaturas</u></a></p>'
        : '<button type="button" class="btn btn-primary" id="btn-candidatar">Candidatar-se</button>';
      box.innerHTML = '<div class="modal-topo"><div><div class="job-company">' + esc(j.emp) + ' · ' + j.tipo + ' · ' + j.modo + '</div><h2 id="vaga-titulo">' + esc(j.titulo) + '</h2></div>' +
        '<button type="button" class="botao-fechar-painel" id="vaga-fechar" aria-label="Fechar detalhes da vaga"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
        '<p class="job-meta"><span>' + esc(j.local) + '</span><span class="salary">' + money(j.sal[0]) + ' – ' + money(j.sal[1]).replace('R$ ', '') + '</span></p>' +
        '<div class="modal-acoes">' + topAct + saveBtn(j) + '</div><div id="area-cand" tabindex="-1"></div>' +
        '<p style="margin:12px 0">' + esc(j.desc) + '</p>' + compatHTML(j) +
        '<h3 class="modal-h">Ficha de acessibilidade</h3><ul class="ficha">' + Object.keys(FEAT).map(function (k) {
          var ok = j.feat.indexOf(k) > -1;
          return '<li class="' + (ok ? 'ok' : 'no') + '"><span aria-hidden="true">' + (ok ? '✔' : '—') + '</span><span><span class="sr-only">' + (ok ? 'Oferece: ' : 'Não informado: ') + '</span>' + FEAT[k] + '</span></li>';
        }).join('') + '</ul>' +
        '<h3 class="modal-h">Aceita candidatos com</h3><div class="job-tags">' + j.pcd.map(function (p) { return '<span class="tag">' + PCD[p] + '</span>'; }).join('') + '</div>';
      modal.classList.add('open');
      $('vaga-fechar').addEventListener('click', fechar);
      $('vaga-fechar').focus();
      var bc = $('btn-candidatar');
      if (bc) bc.addEventListener('click', function () { candidatar(j, bc); });
    }
    function candidatar(j, bc) {
      var a = $('area-cand');
      if (!email) {
        a.innerHTML = '<div class="aviso-perfil" role="alert"><strong>Entre para se candidatar</strong><p style="margin:8px 0 12px">Você precisa de uma conta para enviar sua candidatura.</p><div class="cta-actions"><a class="btn btn-primary" href="entrar.html?next=' + encodeURIComponent('vagas.html?vaga=' + j.id) + '">Entrar</a><a class="btn btn-ghost" href="cadastro.html">Cadastrar grátis</a></div></div>';
        a.focus(); return;
      }
      var f = faltando();
      if (f.length) {
        a.innerHTML = '<div class="aviso-perfil" role="alert"><strong>Complete seu perfil antes de se candidatar</strong><p style="margin-top:6px">Falta preencher:</p><ul>' + f.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul><a class="btn btn-primary" href="perfil.html?voltar=' + j.id + '">Completar perfil e enviar currículo</a></div>';
        a.focus(); say('Complete seu perfil antes de se candidatar. Faltam ' + f.length + ' itens.'); return;
      }
      a.innerHTML = '<form id="form-candidatar" novalidate style="margin-top:12px"><fieldset class="grupo"><legend>Adaptações que você precisa no processo seletivo (opcional)</legend>' + checks('adapt', ADAPT, [], 'ad') + '</fieldset>' +
        '<div class="form-group"><label for="cand-msg">Mensagem para a empresa (opcional)</label><div class="input-wrap"><textarea id="cand-msg" rows="3"></textarea></div></div>' +
        '<p class="hint-text" style="margin-bottom:12px">Será enviado o currículo ' + esc(perfil.cv.nome) + '. Seu diagnóstico não é compartilhado: a empresa recebe apenas as adaptações marcadas aqui.</p>' +
        '<button type="submit" class="btn btn-primary">Enviar candidatura</button></form>';
      $('ad-libras').focus();
      $('form-candidatar').addEventListener('submit', function (e) {
        e.preventDefault();
        var ad = Array.prototype.map.call(a.querySelectorAll('input[name="adapt"]:checked'), function (i) { return i.value; });
        cands.push({ id: Date.now(), jobId: j.id, data: new Date().toISOString(), adapt: ad, msg: $('cand-msg').value.trim(), stage: 0, cv: perfil.cv.nome });
        W(CK, JSON.stringify(cands));
        var via = perfil.comm ? ' Entraremos em contato por: ' + COMM[perfil.comm].toLowerCase() + '.' : '';
        pushMsg('j' + j.id, { jobId: j.id, emp: j.emp, cor: j.cor, assunto: 'Candidatura: ' + j.titulo },
          'Recebemos sua candidatura para ' + j.titulo + '.' + (ad.length ? ' Registramos seu pedido de adaptação: ' + ad.map(function (x) { return ADAPT[x].toLowerCase(); }).join('; ') + '.' : '') + via, 'emp');
        saveMsgs();
        bc.hidden = true;
        a.innerHTML = '<p class="form-status show status-success" role="status" tabindex="-1" id="cand-ok">Candidatura enviada para a ' + esc(j.emp) + '! Veja em <a href="candidaturas.html"><u>Candidaturas</u></a> e responda no <a href="mensagens.html"><u>chat</u></a>.</p>';
        $('cand-ok').focus(); say('Candidatura enviada com sucesso.');
      });
    }
    render();
    if (params.get('vaga')) abrir(params.get('vaga'), q);
  }

  /* ---------------- Candidaturas (Salvas / Candidaturas / Entrevistas / Arquivadas) ---------------- */
  function initCandidaturas() {
    var ABAS = [['salvas', 'Salvas'], ['cands', 'Candidaturas'], ['entrev', 'Entrevistas'], ['arq', 'Arquivadas']];
    var atual = new URLSearchParams(location.search).get('aba') || 'cands';
    var tabs = $('abas'), painel = $('aba-painel');
    tabs.innerHTML = ABAS.map(function (a) { return '<button type="button" role="tab" id="tab-' + a[0] + '" data-aba="' + a[0] + '" aria-controls="aba-painel"></button>'; }).join('');
    function grupos() {
      var ativas = cands.filter(function (c) { return !c.arq; });
      return { salvas: salvas.map(byId).filter(Boolean), cands: ativas, entrev: ativas.filter(function (c) { return c.stage === 2; }), arq: cands.filter(function (c) { return c.arq; }) };
    }
    function item(c, arq) {
      var j = byId(c.jobId); if (!j) return '';
      return '<li class="cand-item"><div class="cand-topo"><div><strong>' + esc(j.titulo) + '</strong><div class="job-company">' + esc(j.emp) + ' · enviada em ' + new Date(c.data).toLocaleDateString('pt-BR') + '</div></div><div class="acoes" style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<a class="btn btn-ghost" href="vagas.html?vaga=' + j.id + '">Ver vaga</a>' +
        (arq ? '<button type="button" class="botao-secundario" style="margin:0" data-restaurar="' + c.id + '">Restaurar</button>' : '<a class="btn btn-ghost" href="mensagens.html?c=j' + j.id + '">Mensagens</a><button type="button" class="botao-secundario" style="margin:0" data-arquivar="' + c.id + '" aria-label="Arquivar candidatura para ' + esc(j.titulo) + '">Arquivar</button>') + '</div></div>' +
        '<ol class="etapas" aria-label="Etapas do processo seletivo">' + ETAPAS.map(function (e, i) { return '<li class="' + (i < c.stage ? 'done' : i === c.stage ? 'current' : '') + '"' + (i === c.stage ? ' aria-current="step"' : '') + '>' + e + (i === c.stage ? '<span class="sr-only"> (etapa atual)</span>' : '') + '</li>'; }).join('') + '</ol>' +
        (c.adapt.length ? '<div class="job-tags">' + c.adapt.map(function (x) { return '<span class="tag">' + ADAPT[x] + '</span>'; }).join('') + '</div>' : '') + '</li>';
    }
    function render() {
      var g = grupos();
      ABAS.forEach(function (a) {
        var b = $('tab-' + a[0]);
        b.textContent = a[1] + ' (' + g[a[0]].length + ')';
        b.setAttribute('aria-selected', a[0] === atual); b.tabIndex = a[0] === atual ? 0 : -1;
      });
      painel.setAttribute('aria-labelledby', 'tab-' + atual);
      var l = g[atual];
      var vazio = { salvas: 'Você ainda não salvou vagas.', cands: 'Você ainda não se candidatou.', entrev: 'Nenhuma entrevista por enquanto. Na demonstração, as etapas avançam sozinhas a cada 2 minutos.', arq: 'Nenhuma candidatura arquivada.' }[atual];
      painel.innerHTML = l.length
        ? (atual === 'salvas' ? '<div class="jobs-grid" style="grid-template-columns:1fr">' + l.map(function (j) { return cardHTML(j, true); }).join('') + '</div>' : '<ul class="lista-limpa">' + l.map(function (c) { return item(c, atual === 'arq'); }).join('') + '</ul>')
        : '<div class="panel-card"><p>' + vazio + ' <a href="vagas.html"><u>Buscar vagas</u></a></p></div>';
    }
    window.__rerender = render;
    function ir(id, foco) { atual = id; render(); if (foco) $('tab-' + id).focus(); say(ABAS.filter(function (a) { return a[0] === id; })[0][1]); }
    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-aba]'); if (b) ir(b.getAttribute('data-aba'), true); });
    tabs.addEventListener('keydown', function (e) {
      var i = ABAS.map(function (a) { return a[0]; }).indexOf(atual);
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(ABAS[(i + 1) % 4][0], true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(ABAS[(i + 3) % 4][0], true); }
    });
    painel.addEventListener('click', function (e) {
      var a = e.target.closest('[data-arquivar]'), r = e.target.closest('[data-restaurar]');
      var id = a ? a.getAttribute('data-arquivar') : r ? r.getAttribute('data-restaurar') : null; if (!id) return;
      cands.forEach(function (c) { if (String(c.id) === id) c.arq = !!a; });
      W(CK, JSON.stringify(cands)); render(); say(a ? 'Candidatura arquivada.' : 'Candidatura restaurada.');
    });
    render();
  }

  /* ---------------- Mensagens ---------------- */
  function initMensagens() {
    var sel = null, lista = $('conversas'), log = $('conv-log'), topo = $('conv-topo'), form = $('form-msg'), txt = $('msg-texto');
    var hora = function (q) { return new Date(q).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
    function renderLista() {
      lista.innerHTML = msgs.slice().sort(function (a, b) { return (b.ult || 0) - (a.ult || 0); }).map(function (t) {
        var u = t.msgs[t.msgs.length - 1];
        return '<li><button type="button" class="conv-btn" data-conv="' + t.id + '"' + (t.id === sel ? ' aria-current="true"' : '') + '><span class="t"><span>' + esc(t.emp) + '</span>' + (t.lida ? '' : '<span class="nova">Nova</span>') + '</span><span class="job-company">' + esc(t.assunto) + '</span><span class="p" style="display:block">' + esc(u.texto) + '</span></button></li>';
      }).join('');
    }
    function abrirConv(id) {
      var t = thread(id); if (!t) return;
      sel = id; t.lida = true; saveMsgs(); renderLista();
      topo.innerHTML = '<span class="job-logo' + (DOMINIOS[t.emp] ? ' tem-img' : '') + '" style="background:' + t.cor + ';width:36px;height:36px;display:inline-flex;margin-right:10px;vertical-align:middle" aria-hidden="true">' + (DOMINIOS[t.emp] ? logoConteudo(t.emp) : esc(t.emp[0])) + '</span>' + esc(t.emp) + ' — ' + esc(t.assunto);
      log.innerHTML = t.msgs.map(function (m) { return '<div class="bolha ' + m.de + '"><span class="sr-only">' + (m.de === 'eu' ? 'Você' : esc(t.emp)) + ' disse: </span>' + esc(m.texto) + '<time>' + hora(m.q) + '</time></div>'; }).join('');
      log.scrollTop = log.scrollHeight; form.hidden = false;
    }
    lista.addEventListener('click', function (e) { var b = e.target.closest('[data-conv]'); if (b) { abrirConv(b.getAttribute('data-conv')); txt.focus(); } });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = txt.value.trim(); if (!v || !sel) return;
      var id = sel; pushMsg(id, {}, v, 'eu'); txt.value = ''; saveMsgs(); abrirConv(id); say('Mensagem enviada.');
      if (id !== 'bv') setTimeout(function () {
        pushMsg(id, {}, 'Obrigado pela mensagem! Nossa equipe de RH responde em até 2 dias úteis. (resposta automática da demonstração)', 'emp');
        if (sel === id) abrirConv(id); else { saveMsgs(); renderLista(); }
      }, 2500);
    });
    renderLista();
    var c = new URLSearchParams(location.search).get('c');
    if (c && thread(c)) abrirConv(c);
  }

  /* ---------------- Perfil + currículo ----------------
     (a página Meu perfil agora é controlada por js/perfil.js) */

  /* ---------------- Recomendadas conforme o perfil ---------------- */
  function recoInfo(j) {
    var m = [], pts = 0, c = compat(j);
    if (c) { pts += 60 * c.ok / c.total; m.push('Atende ' + c.ok + ' de ' + c.total + ' das suas adaptações'); }
    var pp = (perfil.pcd || []).filter(function (x) { return j.pcd.indexOf(x) > -1; });
    if (pp.length) { pts += 25; m.push('Aceita ' + pp.map(function (x) { return PCD[x].toLowerCase().replace('(tea)', '(TEA)'); }).join(', ')); }
    var txt = (j.titulo + ' ' + j.tags.join(' ')).toLowerCase();
    var area = (perfil.area || '').toLowerCase().split(/\s+/).filter(function (w) { return w.length > 2; });
    if (area.some(function (w) { return txt.indexOf(w) > -1; })) { pts += 15; m.push('Combina com a sua área de interesse'); }
    var cd = (perfil.cidade || '').toLowerCase().split(',')[0].trim();
    if (j.modo === 'Remoto') pts += 5;
    if (cd && j.local.toLowerCase().indexOf(cd) > -1) { pts += 5; m.push('Na sua cidade'); }
    if (!m.length) m.push('Vaga recente com ficha de acessibilidade completa');
    return { pts: pts, m: m };
  }
  function initReco() {
    var sec = $('recomendadas'); if (!sec || !email) return;
    var ja = cands.map(function (c) { return c.jobId; });
    var r = JOBS.filter(function (j) { return ja.indexOf(j.id) < 0; }).map(function (j) { return { j: j, i: recoInfo(j) }; })
      .sort(function (a, b) { return b.i.pts - a.i.pts || a.j.dias - b.j.dias; }).slice(0, 3);
    var vazio = !((perfil.pcd || []).length || (perfil.needs || []).length || perfil.area);
    $('reco-msg').innerHTML = vazio ? '<p class="aviso-info">Complete seu <a href="perfil.html"><u>perfil de acessibilidade</u></a> para receber recomendações feitas para você. Por enquanto, mostramos as vagas mais recentes.</p>' : '';
    $('reco-lista').innerHTML = r.map(function (x) {
      return cardHTML(x.j, true).replace(/<\/article>$/, '<p class="motivo"><strong>Por que recomendamos:</strong> ' + x.i.m.map(esc).join(' · ') + '.</p></article>');
    }).join('');
    sec.hidden = false;
  }
  /* Pontuação do perfil (0 a 100). Usada na página Meu perfil e no Painel. */
  function pontosPerfil(p) {
    var n = function (x) { return (x || []).length; }, e = p.endereco || {}, t = 0;
    t += p.telefone ? 8 : 0;
    t += (e.cep && e.numero) ? 8 : 0;
    t += p.area ? 6 : 0;
    t += p.resumo ? 6 : 0;
    t += p.cv ? 20 : 0;
    t += p.escolaridade ? 4 : 0;
    t += n(p.experiencias) ? 10 : 0;
    t += n(p.formacoes) ? 4 : 0;
    t += n(p.habilidades) ? 8 : 0;
    t += n(p.competencias) ? 4 : 0;
    t += n(p.idiomas) ? 3 : 0;
    t += n(p.needs) ? 7 : 0;
    t += p.comm ? 3 : 0;
    t += (n(p.modelos) || p.pretensao || p.disponibilidade) ? 4 : 0;
    t += (n(p.pcd) && p.laudo) ? 5 : 0;
    return t;
  }

  window.IP = { pontosPerfil: pontosPerfil, faltando: faltando, perfilAtual: function () { return perfil; }, logoConteudo: logoConteudo, DOMINIOS: DOMINIOS, aplicarLogos: aplicarLogos, JOBS: JOBS, FEAT: FEAT, SHORT: SHORT, PCD: PCD, ADAPT: ADAPT, esc: esc, say: say, email: email, byId: byId, slug: slug, cardHTML: cardHTML, J: J, W: W };

  document.addEventListener('DOMContentLoaded', function () {
    aplicarLogos();   /* logos reais nos blocos fixos do HTML (home e painel) */
    if (email) sync();
    initReco();
    if ($('lista-vagas')) initVagas();
    if ($('abas') && email) initCandidaturas();
    if ($('conversas') && email) initMensagens();
  });
})();
