/* ==========================================================================
   IncluiPro — painel.js : PÁGINA "MEU PAINEL" (painel.html)
   Mostra um resumo REAL da conta de quem está logado, lendo do localStorage:
     • números: candidaturas enviadas, vagas salvas, mensagens não lidas, perfil %
     • vagas recomendadas (as mais recentes, de js/app.js)
     • barra de progresso do perfil e o que ainda falta preencher
   Nada é inventado: se a pessoa ainda não fez nada, os números aparecem como 0.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  var IP = window.IP;
  if (!IP || !IP.email || !document.getElementById('painel-numeros')) return;
  var $ = function (id) { return document.getElementById(id); };

  /* Lê as listas desta conta (cada conta tem as suas chaves terminadas no e-mail) */
  var cands = IP.J('incluipro_cands_' + IP.email, []);
  var salvas = IP.J('incluipro_salvas_' + IP.email, []);
  var msgs = IP.J('incluipro_msgs_' + IP.email, []);
  var naoLidas = msgs.filter(function (t) { return !t.lida; }).length;
  var perfil = IP.perfilAtual();
  var pct = IP.pontosPerfil(perfil);

  /* ---- Números de resumo (cada um é um link para a página correspondente) ---- */
  var itens = [
    [cands.length, 'Candidaturas', 'candidaturas.html'],
    [salvas.length, 'Vagas salvas', 'candidaturas.html'],
    [naoLidas, 'Mensagens não lidas', 'mensagens.html'],
    [pct + '%', 'Perfil completo', 'perfil.html']
  ];
  $('painel-numeros').innerHTML = itens.map(function (i) {
    return '<a class="painel-num" href="' + i[2] + '"><span class="stat-value">' + i[0] + '</span><span class="stat-label">' + i[1] + '</span></a>';
  }).join('');

  /* ---- Barra de progresso e pendências ---- */
  $('painel-barra').setAttribute('aria-valuenow', pct);
  $('painel-barra').firstElementChild.style.width = pct + '%';
  $('painel-pct').textContent = pct + '% completo';
  var falta = IP.faltando();
  $('painel-falta').textContent = falta.length ? 'Falta para se candidatar: ' + falta.join(', ') + '.' : 'Seu perfil está pronto para se candidatar.';

  /* ---- Vagas recomendadas: as 3 mais recentes (dias = há quantos dias foi publicada) ---- */
  var recentes = IP.JOBS.slice().sort(function (a, b) { return a.dias - b.dias; }).slice(0, 3);
  $('painel-vagas').innerHTML = recentes.map(function (j) { return IP.cardHTML(j, true); }).join('');
  if (IP.aplicarLogos) IP.aplicarLogos();
});
