/* ==========================================================================
   IncluiPro — paginas.js : EMPRESAS, AVALIAÇÕES E FORMULÁRIO DE CONTATO
   • empresas.html  lista as empresas (montadas a partir das vagas de app.js)
   • empresa.html   página de cada empresa + avaliações (salvas em incluipro_avaliacoes)
   • sobre.html     formulário de contato -> envia para samanthapaulaa@gmail.com
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  var IP = window.IP; if (!IP) return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = IP.esc, say = IP.say, email = IP.email;
  var SETOR = { 'Nubank': 'Serviços financeiros', 'iFood': 'Tecnologia e delivery', 'Totvs': 'Software de gestão', 'Ambev': 'Bebidas e logística', 'Itaú': 'Bancos e finanças', 'Magazine Luiza': 'Varejo', 'Mercado Livre': 'Comércio eletrônico', 'Vivo': 'Telecomunicações' };
  var GRUPOS = [['Acessibilidade física', ['fisica']], ['Comunicação', ['libras', 'legenda']], ['Tecnologia e ferramentas', ['leitor', 'assist']], ['Flexibilidade e bem-estar', ['flex', 'remoto', 'calmo']]];
  var DET = {
    fisica: 'Rampas, elevadores, vagas reservadas e banheiros adaptados, conforme a norma ABNT NBR 9050.',
    libras: 'Intérpretes de Libras em entrevistas, treinamentos e reuniões, mediante solicitação prévia.',
    legenda: 'Reuniões e treinamentos com legenda ao vivo ou transcrição automática.',
    leitor: 'Sistemas internos e ferramentas de trabalho compatíveis com leitores de tela.',
    assist: 'Tecnologia assistiva fornecida pela empresa, como teclados e mouses adaptados, ampliadores de tela e software de voz.',
    flex: 'Horários flexíveis para consultas, terapias e rotinas de cuidado.',
    remoto: 'Trabalho remoto, total ou parcial, para reduzir barreiras de deslocamento.',
    calmo: 'Espaços e rotinas com baixa estimulação sensorial, pausas e comunicação objetiva.'
  };

  /* ---------- Empresas a partir das vagas ---------- */
  var companies = [];
  IP.JOBS.forEach(function (j) {
    var c = companies.filter(function (x) { return x.nome === j.emp; })[0];
    if (!c) { c = { id: IP.slug(j.emp), nome: j.emp, cor: j.cor, setor: SETOR[j.emp] || 'Diversos', vagas: [], feat: [], pcd: [] }; companies.push(c); }
    c.vagas.push(j);
    j.feat.forEach(function (f) { if (c.feat.indexOf(f) < 0) c.feat.push(f); });
    j.pcd.forEach(function (p) { if (c.pcd.indexOf(p) < 0) c.pcd.push(p); });
  });
  companies.sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });

  /* ---------- Avaliações ---------- */
  var RK = 'incluipro_avaliacoes', avals = IP.J(RK, []);
  var fmt = function (n) { return n.toFixed(1).replace('.', ','); };
  var estrelas = function (n, rot) { var r = Math.round(n); return '<span class="estrelas" role="img" aria-label="' + rot + ': ' + fmt(n) + ' de 5">' + '★'.repeat(r) + '☆'.repeat(5 - r) + '</span>'; };
  function stats(id) {
    var l = avals.filter(function (a) { return a.emp === id; });
    if (!l.length) return null;
    var m = function (k) { return l.reduce(function (t, a) { return t + a[k]; }, 0) / l.length; };
    return { n: l.length, nota: m('nota'), acess: m('acess'), rec: Math.round(100 * l.filter(function (a) { return a.rec; }).length / l.length) };
  }
  var nVagas = function (c) { return c.vagas.length + (c.vagas.length === 1 ? ' vaga aberta' : ' vagas abertas'); };

  /* ================= Lista de empresas ================= */
  if ($('emp-lista')) {
    var q = $('emp-q');
    var card = function (c) {
      var st = stats(c.id);
      return '<article class="emp-card"><div class="emp-head"><span class="job-logo tem-img" style="background:' + c.cor + ';" aria-hidden="true">' + IP.logoConteudo(c.nome) + '</span>' +
        '<div><h2 class="emp-nome"><a href="empresa.html?id=' + c.id + '">' + esc(c.nome) + '</a></h2><div class="job-company">' + esc(c.setor) + '</div></div></div>' +
        '<p><strong>' + nVagas(c) + '</strong></p>' +
        '<p>' + (st ? estrelas(st.nota, 'Nota geral') + ' <span class="job-company">' + fmt(st.nota) + ' · ' + st.n + (st.n === 1 ? ' avaliação' : ' avaliações') + '</span>' : '<span class="job-company">Sem avaliações ainda</span>') + '</p>' +
        '<div class="job-tags">' + c.feat.slice(0, 3).map(function (f) { return '<span class="tag">' + IP.SHORT[f] + '</span>'; }).join('') + '</div>' +
        '<a class="btn btn-ghost" href="empresa.html?id=' + c.id + '" aria-label="Ver informações completas de ' + esc(c.nome) + '">Ver empresa</a></article>';
    };
    var render = function () {
      var t = q.value.trim().toLowerCase();
      var l = companies.filter(function (c) { return !t || c.nome.toLowerCase().indexOf(t) > -1 || c.setor.toLowerCase().indexOf(t) > -1; });
      $('emp-contagem').textContent = l.length + (l.length === 1 ? ' empresa encontrada' : ' empresas encontradas');
      $('emp-lista').innerHTML = l.length ? l.map(card).join('') : '<p>Nenhuma empresa encontrada.</p>';
    };
    q.addEventListener('input', render);
    $('emp-form').addEventListener('submit', function (e) { e.preventDefault(); render(); });
    render();
  }

  /* ================= Perfil da empresa ================= */
  if ($('emp-detalhe')) {
    var id = new URLSearchParams(location.search).get('id');
    var c = companies.filter(function (x) { return x.id === id; })[0];
    var root = $('emp-detalhe');
    if (!c) {
      root.innerHTML = '<section class="pg-hero"><div class="wrap"><h1 class="pg-title">Empresa não encontrada</h1><p><a href="empresas.html"><u>Ver todas as empresas</u></a></p></div></section>';
      return;
    }
    document.title = c.nome + ' | IncluiPro';

    var acessHTML = GRUPOS.map(function (g) {
      var itens = g[1].map(function (f) {
        var ok = c.feat.indexOf(f) > -1;
        return ok ? '<li class="ok"><span aria-hidden="true">✔</span><span><strong>' + IP.SHORT[f] + ':</strong> ' + DET[f] + '</span></li>'
                  : '<li class="no"><span aria-hidden="true">—</span><span><span class="sr-only">Não informado: </span>' + IP.FEAT[f] + '</span></li>';
      }).join('');
      return '<div class="lei-card"><h3>' + g[0] + '</h3><ul class="ficha-g">' + itens + '</ul></div>';
    }).join('') +
      '<div class="lei-card" style="grid-column:1/-1"><h3>Processo seletivo acessível</h3><p>Aceita pedidos de adaptação no processo seletivo, como intérprete de Libras, tempo extra em testes, materiais em formato acessível, entrevista por texto ou chat e local de entrevista acessível. Você pede ao se candidatar, e seu diagnóstico não é compartilhado.</p></div>';

    root.innerHTML =
      '<section class="pg-hero"><div class="wrap"><a href="empresas.html">← Todas as empresas</a>' +
      '<div class="emp-head" style="margin-top:18px"><span class="emp-logo-g tem-img" style="background:' + c.cor + ';" aria-hidden="true">' + IP.logoConteudo(c.nome) + '</span><div><h1 class="pg-title" style="margin:0">' + esc(c.nome) + '</h1><p class="job-company">' + esc(c.setor) + ' · ' + nVagas(c) + '</p><p id="emp-resumo-topo"></p></div></div></div></section>' +
      '<section style="padding:36px 0 8px;"><div class="wrap"><p class="aviso-info"><strong>Dados de demonstração.</strong> As informações de acessibilidade desta página são ilustrativas. Na versão final, cada empresa preenche e atualiza a própria ficha.</p>' +
      '<h2 class="emp-h">Sobre a empresa</h2><p>Atua em ' + esc(c.setor.toLowerCase()) + ' e anuncia vagas na IncluiPro. Aceita candidatos com: ' + c.pcd.map(function (p) { return IP.PCD[p].toLowerCase().replace('(tea)', '(TEA)'); }).join(', ') + '.</p>' +
      '<h2 class="emp-h">Condições de acessibilidade</h2><div class="acess-grid">' + acessHTML + '</div></div></section>' +
      '<section style="padding:36px 0;"><div class="wrap"><h2 class="emp-h" id="vagas-emp">Vagas disponíveis (' + c.vagas.length + ')</h2><div class="jobs-grid">' + c.vagas.map(function (j) { return IP.cardHTML(j, true); }).join('') + '</div></div></section>' +
      '<section id="avaliacoes" style="padding:36px 0 64px;background:var(--color-surface-soft);"><div class="wrap"><h2 class="emp-h">Avaliações e comentários</h2><div id="aval-area"></div></div></section>';

    var next = encodeURIComponent('empresa.html?id=' + c.id);
    var meuId = email || '';

    function renderAval() {
      var st = stats(c.id), lista = avals.filter(function (a) { return a.emp === c.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
      var minha = lista.filter(function (a) { return a.uid === meuId; })[0];
      $('emp-resumo-topo').innerHTML = st ? estrelas(st.nota, 'Nota geral') + ' <strong>' + fmt(st.nota) + '</strong> <span class="job-company">(' + st.n + (st.n === 1 ? ' avaliação' : ' avaliações') + ')</span>' : '<span class="job-company">Sem avaliações ainda</span>';

      var resumo = st ? '<div class="resumo-aval"><div><div class="nota">' + fmt(st.nota) + '</div>' + estrelas(st.nota, 'Nota geral') + '<div class="job-company">Nota geral</div></div>' +
        '<div><div class="nota">' + fmt(st.acess) + '</div>' + estrelas(st.acess, 'Nota de acessibilidade') + '<div class="job-company">Acessibilidade</div></div>' +
        '<div><div class="nota">' + st.rec + '%</div><div class="job-company">recomendam a empresa</div></div></div>' : '<p>Esta empresa ainda não recebeu avaliações. Seja a primeira pessoa a compartilhar sua experiência.</p>';

      var opts = '<option value="">Selecione</option><option value="5">5 – Excelente</option><option value="4">4 – Boa</option><option value="3">3 – Regular</option><option value="2">2 – Ruim</option><option value="1">1 – Muito ruim</option>';
      var form;
      if (!email) form = '<div class="lei-card"><p>Para avaliar esta empresa, <a href="entrar.html?next=' + next + '"><u>entre na sua conta</u></a> ou <a href="cadastro.html"><u>cadastre-se grátis</u></a>.</p></div>';
      else if (minha) form = '<div class="lei-card"><p>Você já avaliou esta empresa. <button type="button" class="botao-secundario" style="margin:0 0 0 8px" id="aval-excluir">Excluir minha avaliação</button></p></div>';
      else form = '<form id="form-aval" class="lei-card" novalidate><h3>Avalie esta empresa</h3>' +
        '<div class="form-group"><label for="av-nota">Nota geral</label><select id="av-nota">' + opts + '</select></div>' +
        '<div class="form-group"><label for="av-acess">Nota de acessibilidade</label><select id="av-acess">' + opts + '</select></div>' +
        '<div class="form-group"><label for="av-texto">Seu comentário (mínimo de 20 caracteres)</label><div class="input-wrap"><textarea id="av-texto" rows="4" maxlength="600"></textarea></div><span class="error-text" id="err-av" role="alert"></span></div>' +
        '<div class="check-row"><input type="checkbox" id="av-rec"><label for="av-rec">Recomendo esta empresa</label></div>' +
        '<div class="check-row"><input type="checkbox" id="av-anon"><label for="av-anon">Publicar como anônimo(a)</label></div>' +
        '<p class="hint-text" style="margin:10px 0 14px">Conte a sua experiência com respeito e sem dados pessoais de terceiros. Comentários que violem os termos de uso podem ser removidos.</p>' +
        '<button type="submit" class="btn btn-primary">Publicar avaliação</button></form>';

      var itens = lista.length ? lista.map(function (a) {
        return '<article class="review"><div class="review-topo"><strong>' + esc(a.autor) + '</strong><span class="job-company">' + new Date(a.data).toLocaleDateString('pt-BR') + '</span></div>' +
          '<p>' + estrelas(a.nota, 'Nota geral') + ' <span class="job-company">Acessibilidade</span> ' + estrelas(a.acess, 'Nota de acessibilidade') + (a.rec ? ' <span class="tag">Recomenda</span>' : '') + '</p>' +
          '<p>' + esc(a.texto) + '</p></article>';
      }).join('') : '';
      $('aval-area').innerHTML = resumo + '<div style="margin:20px 0">' + form + '</div>' + itens;

      var f = $('form-aval');
      if (f) f.addEventListener('submit', function (e) {
        e.preventDefault();
        var nota = Number($('av-nota').value), ac = Number($('av-acess').value), tx = $('av-texto').value.trim(), er = $('err-av');
        if (!nota || !ac) { er.textContent = 'Escolha a nota geral e a nota de acessibilidade.'; (nota ? $('av-acess') : $('av-nota')).focus(); return; }
        if (tx.length < 20) { er.textContent = 'Escreva pelo menos 20 caracteres no comentário.'; $('av-texto').focus(); return; }
        var users = IP.J('incluipro_users', []), u = users.filter(function (x) { return x.email === email; })[0] || { nome: 'Usuário' };
        var partes = u.nome.trim().split(/\s+/);
        var autor = $('av-anon').checked ? 'Anônimo(a)' : partes[0] + (partes.length > 1 ? ' ' + partes[partes.length - 1][0] + '.' : '');
        avals.push({ id: Date.now(), emp: c.id, uid: email, autor: autor, nota: nota, acess: ac, texto: tx, rec: $('av-rec').checked, data: new Date().toISOString() });
        IP.W(RK, JSON.stringify(avals)); renderAval(); say('Avaliação publicada. Obrigado por compartilhar sua experiência.');
        $('avaliacoes').scrollIntoView();
      });
      var ex = $('aval-excluir');
      if (ex) ex.addEventListener('click', function () {
        avals = avals.filter(function (a) { return !(a.emp === c.id && a.uid === meuId); });
        IP.W(RK, JSON.stringify(avals)); renderAval(); say('Avaliação excluída.');
      });
    }
    renderAval();
  }

  /* ================= Contato / suporte / barreiras =================
   O formulário envia a mensagem para samanthapaulaa@gmail.com (ver INCLUIPRO_EMAIL em auth.js).
   Ordem de tentativa: 1) EmailJS (se configurado)  2) FormSubmit (padrão, sem conta)  3) app de e-mail da pessoa. */
  if ($('form-contato')) {
    var as = new URLSearchParams(location.search).get('assunto');
    if (as && $('ct-assunto').querySelector('option[value="' + as + '"]')) $('ct-assunto').value = as;
    var users = IP.J('incluipro_users', []), eu = users.filter(function (x) { return x.email === email; })[0];
    if (eu) { $('ct-nome').value = eu.nome; $('ct-email').value = eu.email; }
    $('form-contato').addEventListener('submit', function (e) {
      e.preventDefault();
      var campos = [['ct-nome', 'err-ct-nome', 'Informe seu nome.'], ['ct-email', 'err-ct-email', 'Informe um e-mail válido.'], ['ct-msg', 'err-ct-msg', 'Escreva sua mensagem.']];
      var ok = true;
      campos.forEach(function (c2) {
        var el = $(c2[0]), v = el.value.trim(), bad = !v || (c2[0] === 'ct-email' && !/^\S+@\S+\.\S+$/.test(v));
        $(c2[1]).textContent = bad ? c2[2] : '';
        if (bad && ok) { el.focus(); ok = false; } else if (bad) ok = false;
      });
      if (!ok) { say('Há campos para corrigir.'); return; }
      /* Dados que o visitante preencheu */
      var nomeC = $('ct-nome').value.trim(), emailC = $('ct-email').value.trim(), msgC = $('ct-msg').value.trim();
      var assuntoSel = $('ct-assunto'), assuntoTxt = assuntoSel.options[assuntoSel.selectedIndex].text;
      var st = $('ct-status'), destino = (window.IPEmail && IPEmail.config.contatoDestino) || 'samanthapaulaa@gmail.com';
      var btn = $('form-contato').querySelector('button[type="submit"]');

      function mostrarOk(txt) { st.className = 'form-status show status-success'; st.textContent = txt; say(txt); }
      function mostrarErro(txt) { st.className = 'form-status show status-error'; st.textContent = txt; say(txt); }

      /* Texto de apoio para o último recurso (abrir o app de e-mail da pessoa) */
      var corpo = 'Nome: ' + nomeC + '\nE-mail para resposta: ' + emailC + '\nAssunto: ' + assuntoTxt + '\n\n' + msgC;
      var link = 'mailto:' + destino + '?subject=' + encodeURIComponent('[IncluiPro] ' + assuntoTxt) + '&body=' + encodeURIComponent(corpo);

      /* --- Tentativa A: EmailJS (usa o template "Contate-nos") --- */
      function viaEmailJS() {
        return IPEmail.enviar(IPEmail.config.contatoTemplateId, {
          /* Variáveis do template "Contate-nos": {{name}}, {{email}}, {{message}}, {{title}} */
          name: nomeC, email: emailC, message: msgC, title: assuntoTxt,
          /* nomes extras, caso você personalize o template */
          to_email: destino,            /* o ideal é deixar o destino FIXO dentro do template do EmailJS */
          from_name: nomeC, from_email: emailC, reply_to: emailC, assunto: assuntoTxt, mensagem: msgC, app_name: 'IncluiPro'
        });
      }
      /* --- Tentativa B: FormSubmit (grátis, sem conta; exige ativação única no e-mail da Samantha) --- */
      function viaFormSubmit() {
        var alvo = IPEmail.config.contatoAlias || destino;
        return fetch('https://formsubmit.co/ajax/' + encodeURIComponent(alvo), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name: nomeC, email: emailC, assunto: assuntoTxt, message: msgC,
            _subject: '[IncluiPro] ' + assuntoTxt,   /* assunto do e-mail recebido */
            _replyto: emailC,                        /* "Responder" no Gmail responde para o visitante */
            _template: 'table', _captcha: 'false'
          })
        }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
          .then(function (res) {
            if (!(res.ok && (res.j.success === true || res.j.success === 'true'))) throw new Error('formsubmit');
          });
      }

      /* Ordem: EmailJS -> FormSubmit -> (se tudo falhar) link para enviar pelo próprio e-mail */
      var usaEmailJS = window.IPEmail && IPEmail.pronto(IPEmail.config.contatoTemplateId);
      var usaFormSubmit = window.IPEmail && IPEmail.config.contatoFormSubmit;
      if (usaEmailJS || usaFormSubmit) {
        btn.disabled = true; var txtBtn = btn.textContent; btn.textContent = 'Enviando…';
        var motivoEmailJS = '';
        var tentativa = usaEmailJS
          ? viaEmailJS().catch(function (err) {
              motivoEmailJS = IPEmail.explicar(err);             /* guarda o motivo para mostrar se tudo falhar */
              if (!usaFormSubmit) throw err;
              return viaFormSubmit();                             /* EmailJS falhou: tenta o FormSubmit */
            })
          : viaFormSubmit();
        tentativa.then(function () {
          mostrarOk('Mensagem enviada! Responderemos no e-mail ' + emailC + '.');
          $('ct-msg').value = '';
        }).catch(function (err) {
          if (!motivoEmailJS && usaEmailJS && err) motivoEmailJS = IPEmail.explicar(err);
          st.className = 'form-status show status-error';
          st.innerHTML = 'Não foi possível enviar agora.' + (motivoEmailJS && IPEmail.config.modoDepuracao ? ' <small>' + esc(motivoEmailJS) + '</small>' : '') +
            ' Você pode enviar pelo seu e-mail: <a href="' + link + '"><u>abrir mensagem pronta para ' + esc(destino) + '</u></a>.';
          say('Não foi possível enviar a mensagem agora.');
        }).then(function () { btn.disabled = false; btn.textContent = txtBtn; });
        return;
      }

      /* CAMINHO 3 — sem nenhum serviço: abre o app de e-mail da pessoa com a mensagem pronta */
      st.className = 'form-status show status-success';
      st.innerHTML = 'Abrimos seu aplicativo de e-mail com a mensagem pronta para <strong>' + esc(destino) + '</strong>. Basta clicar em enviar. Se nada abriu, <a href="' + link + '"><u>clique aqui</u></a>.';
      say('Abrindo seu aplicativo de e-mail.');
      window.location.href = link;
    });
  }
});
