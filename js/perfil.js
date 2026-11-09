/* ==========================================================================
   IncluiPro — PÁGINA "MEU PERFIL" (perfil.html)
   --------------------------------------------------------------------------
   Este arquivo controla todo o formulário de perfil/currículo:
     • endereço automático pelo CEP (API gratuita ViaCEP)
     • deficiência com especificação + laudo médico em PDF obrigatório
     • habilidades, competências, idiomas, cursos
     • formação e experiência profissional (listas que crescem)
     • diversidade (tudo opcional)
     • barra de progresso do perfil

   ONDE OS DADOS FICAM?  Não existe banco de dados. Tudo é salvo no
   "localStorage" do navegador (uma pequena memória que fica no computador da
   pessoa), na chave  incluipro_perfil_<email>.  Ou seja: cada conta tem o seu
   perfil, mas só no navegador em que foi preenchido.
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* IP vem do app.js (funções e dados compartilhados entre as páginas) */
  var IP = window.IP;
  if (!IP || !IP.email || !document.getElementById('perfil-form')) return;

  /* ---------- Atalhos pequenos ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var esc = IP.esc;        /* esc() troca < > & " por versões seguras (evita injeção de HTML) */
  var say = IP.say;        /* say() avisa leitores de tela ("Perfil salvo.") */
  var PK = 'incluipro_perfil_' + IP.email;   /* chave onde ESTE usuário guarda o perfil */

  /* ======================================================================
     1) ESTADO: o objeto "perfil" guarda tudo que a pessoa preencheu.
        Os valores abaixo são os padrões; o que já estava salvo sobrescreve.
     ====================================================================== */
  var ENDERECO_VAZIO = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };
  var DIVERSIDADE_VAZIA = { trans: '', genero: '', pronomes: '', orientacao: '', raca: '', consentimento: false };

  var perfil = Object.assign({
    telefone: '', cidade: '', area: '', resumo: '', escolaridade: '', cv: null,
    pcd: [],            /* categorias marcadas: ['fisica', 'visual', ...] */
    pcdDetalhe: {},     /* especificações:      { fisica: ['Paraplegia ...'] } */
    pcdOutro: {},       /* texto "outra":       { fisica: 'minha condição' } */
    laudo: null,        /* { nome, tam, data, url } — PDF do laudo médico */
    needs: [], comm: '',
    endereco: {}, pretensao: '', modelos: [], disponibilidade: '', linkedin: '', portfolio: '',
    formacoes: [], experiencias: [], habilidades: [], competencias: [], idiomas: [], cursos: [],
    diversidade: {}
  }, IP.J(PK, {}));
  perfil.endereco = Object.assign({}, ENDERECO_VAZIO, perfil.endereco);
  perfil.diversidade = Object.assign({}, DIVERSIDADE_VAZIA, perfil.diversidade);

  /* Perfis antigos guardavam só "cidade" (ex.: "Campinas, SP"): aproveitamos isso */
  if (!perfil.endereco.cidade && perfil.cidade) {
    var partes = perfil.cidade.split(',');
    perfil.endereco.cidade = partes[0].trim();
    perfil.endereco.uf = (partes[1] || '').trim().toUpperCase();
  }

  /* Salva no localStorage. Devolve false se o navegador recusar (memória cheia). */
  function salvar() {
    try { localStorage.setItem(PK, JSON.stringify(perfil)); return true; }
    catch (e) { return false; }
  }

  /* ======================================================================
     2) DADOS FIXOS (listas de opções)
     ====================================================================== */
  /* Especificações por tipo de deficiência (como no InfoJobs).
     As chaves (fisica, visual...) são as mesmas usadas nas vagas. */
  var DETALHES_PCD = {
    fisica: ['Paraplegia (paralisia das pernas)', 'Tetraplegia (paralisia dos quatro membros)', 'Amputação ou ausência de membro', 'Paralisia cerebral', 'Lesão medular', 'Nanismo', 'Mobilidade reduzida', 'Deformidade congênita ou adquirida'],
    visual: ['Cegueira total', 'Baixa visão', 'Visão monocular (um olho)'],
    auditiva: ['Surdez bilateral (total)', 'Surdez unilateral', 'Perda auditiva parcial bilateral'],
    intelectual: ['Síndrome de Down', 'Deficiência intelectual leve', 'Deficiência intelectual moderada'],
    autismo: ['TEA — nível 1 de suporte', 'TEA — nível 2 de suporte', 'TEA — nível 3 de suporte', 'Prefiro não informar o nível'],
    multipla: ['Surdocegueira', 'Física + visual', 'Física + auditiva', 'Física + intelectual', 'Auditiva + visual']
  };
  var MODELOS = ['Presencial', 'Híbrido', 'Remoto'];
  var SUGESTOES_HABILIDADES = ['Excel', 'Pacote Office', 'Atendimento ao cliente', 'Digitação', 'Vendas', 'Python', 'SQL', 'Power BI', 'JavaScript', 'Design gráfico', 'Figma', 'Edição de vídeo', 'Redes sociais', 'Contabilidade', 'Logística'];
  var SUGESTOES_COMPETENCIAS = ['Comunicação', 'Trabalho em equipe', 'Organização', 'Proatividade', 'Resolução de problemas', 'Adaptabilidade', 'Atenção aos detalhes', 'Liderança', 'Empatia', 'Gestão do tempo', 'Criatividade', 'Responsabilidade'];

  /* ======================================================================
     3) FERRAMENTAS GENÉRICAS
     ====================================================================== */

  /* ---- 3.1 "Chips": caixinhas de tags (habilidades e competências) ----
     A pessoa digita (ou clica numa sugestão) e a tag aparece com um "×" para remover. */
  function criarChips(cfg) {
    /* cfg = { raiz, chave, rotulo, sugestoes, placeholder } */
    var raiz = $(cfg.raiz), lista = perfil[cfg.chave], idInput = cfg.raiz + '-campo';

    function desenhar(focarCampo) {
      var tags = lista.map(function (t, i) {
        return '<span class="chip" role="listitem">' + esc(t) + '<button type="button" class="chip-x" data-rem="' + i + '" aria-label="Remover ' + esc(t) + '">×</button></span>';
      }).join('');
      var sug = cfg.sugestoes.filter(function (x) { return lista.indexOf(x) < 0; }).slice(0, 10).map(function (x) {
        return '<button type="button" class="chip-sug" data-sug="' + esc(x) + '">+ ' + esc(x) + '</button>';
      }).join('');
      raiz.innerHTML =
        '<h3 class="sub-h" style="margin-top:0">' + cfg.rotulo + '</h3>' +
        '<div class="chips-lista" role="list" aria-label="' + cfg.rotulo + ' adicionadas">' + (tags || '<span class="hint-text">Nenhuma adicionada ainda.</span>') + '</div>' +
        '<div class="chips-add"><div class="form-group"><label for="' + idInput + '">Digite e aperte Enter para adicionar</label>' +
        '<div class="input-wrap"><input type="text" id="' + idInput + '" maxlength="40" placeholder="' + cfg.placeholder + '"></div></div>' +
        '<button type="button" class="botao-secundario" data-add style="margin:0">Adicionar</button></div>' +
        (sug ? '<div class="chips-sug"><span>Sugestões:</span>' + sug + '</div>' : '');
      if (focarCampo) $(idInput).focus();
    }
    function adicionar(texto) {
      texto = (texto || '').replace(/,/g, ' ').trim();
      if (!texto) return;
      /* não repete (ignora maiúsculas/minúsculas) e limita a 30 itens */
      var jaTem = lista.some(function (t) { return t.toLowerCase() === texto.toLowerCase(); });
      if (!jaTem && lista.length < 30) { lista.push(texto); say(texto + ' adicionado.'); }
      desenhar(true);
    }
    /* Um único "ouvinte" na raiz cuida de todos os cliques e do Enter */
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-add')) adicionar($(idInput).value);
      else if (b.hasAttribute('data-sug')) adicionar(b.getAttribute('data-sug'));
      else if (b.hasAttribute('data-rem')) { var t = lista.splice(Number(b.getAttribute('data-rem')), 1)[0]; say(t + ' removido.'); desenhar(true); }
    });
    raiz.addEventListener('keydown', function (e) {
      if (e.target.id === idInput && (e.key === 'Enter' || e.key === ',')) { e.preventDefault(); adicionar(e.target.value); }
    });
    desenhar(false);
  }

  /* ---- 3.2 Lista repetível: formação, experiência, idiomas, cursos ----
     Mostra um bloco de campos por item, com "Remover" e um botão "Adicionar".
     Os campos atualizam o objeto "perfil" assim que a pessoa digita. */
  function criarLista(cfg) {
    /* cfg = { raiz, chave, titulo, botao, max, campos:[{k, rotulo, tipo, opcoes, placeholder}] } */
    var raiz = $(cfg.raiz), itens = perfil[cfg.chave];

    function campoHTML(c, it, n) {
      var id = cfg.chave + '-' + n + '-' + c.k, v = it[c.k] || '';
      var attrs = ' id="' + id + '" data-n="' + n + '" data-k="' + c.k + '"';
      if (c.tipo === 'select') {
        return '<div class="form-group"><label for="' + id + '">' + c.rotulo + '</label><select' + attrs + '><option value="">Selecione</option>' +
          c.opcoes.map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></div>';
      }
      if (c.tipo === 'textarea') {
        return '<div class="form-group"><label for="' + id + '">' + c.rotulo + '</label><div class="input-wrap"><textarea' + attrs + ' rows="3" maxlength="500" placeholder="' + (c.placeholder || '') + '">' + esc(v) + '</textarea></div></div>';
      }
      if (c.tipo === 'checkbox') {
        return '<div class="check-row"><input type="checkbox"' + attrs + (it[c.k] ? ' checked' : '') + '><label for="' + id + '">' + c.rotulo + '</label></div>';
      }
      /* campo de texto / mês / número. "fim" fica desligado quando é o trabalho atual */
      var desligado = (c.k === 'fim' && it.atual) ? ' disabled' : '';
      return '<div class="form-group"><label for="' + id + '">' + c.rotulo + '</label><div class="input-wrap"><input type="' + (c.tipo || 'text') + '"' + attrs + desligado +
        ' maxlength="80" value="' + esc(v) + '" placeholder="' + (c.placeholder || '') + '"></div></div>';
    }
    function desenhar() {
      raiz.innerHTML = itens.map(function (it, n) {
        return '<fieldset class="item-lista"><legend>' + cfg.titulo + ' ' + (n + 1) + '</legend>' +
          cfg.campos.map(function (c) { return campoHTML(c, it, n); }).join('') +
          '<button type="button" class="botao-secundario" data-rem="' + n + '">Remover ' + cfg.titulo.toLowerCase() + ' ' + (n + 1) + '</button></fieldset>';
      }).join('') +
        (itens.length < (cfg.max || 10) ? '<button type="button" class="botao-secundario" data-add style="margin-top:0">+ ' + cfg.botao + '</button>' : '');
    }
    /* Digitou/escolheu algo: guarda no item certo (data-n = posição, data-k = nome do campo) */
    function atualizar(e) {
      var el = e.target, n = el.getAttribute('data-n'), k = el.getAttribute('data-k');
      if (n === null) return;
      itens[n][k] = el.type === 'checkbox' ? el.checked : el.value;
      if (k === 'atual') {             /* "trabalho aqui atualmente": limpa e desliga a data final */
        var fim = $(cfg.chave + '-' + n + '-fim');
        if (fim) { fim.disabled = el.checked; if (el.checked) { fim.value = ''; itens[n].fim = ''; } }
      }
    }
    raiz.addEventListener('input', atualizar);
    raiz.addEventListener('change', atualizar);
    raiz.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-add')) { itens.push({}); desenhar(); say(cfg.titulo + ' adicionada.'); var p = $(cfg.chave + '-' + (itens.length - 1) + '-' + cfg.campos[0].k); if (p) p.focus(); }
      if (b.hasAttribute('data-rem')) { itens.splice(Number(b.getAttribute('data-rem')), 1); desenhar(); say(cfg.titulo + ' removida.'); }
    });
    desenhar();
  }

  /* ---- 3.3 Máscaras (formatam enquanto a pessoa digita) ---- */
  var soDigitos = function (v) { return String(v).replace(/\D/g, ''); };
  function mascaraTelefone(v) {             /* (11) 91234-5678 */
    var d = soDigitos(v).slice(0, 11);
    if (d.length > 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length === 11 ? 7 : 6) + '-' + d.slice(d.length === 11 ? 7 : 6);
    if (d.length > 2) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    return d;
  }
  function mascaraCep(v) {                  /* 13086-900 */
    var d = soDigitos(v).slice(0, 8);
    return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
  }

  /* ======================================================================
     4) PREENCHER A TELA COM O QUE JÁ ESTÁ SALVO
     ====================================================================== */
  var u = IP.J('incluipro_users', []).filter(function (x) { return x.email === IP.email; })[0] || {};
  $('conta-nome').textContent = u.nome || '';
  $('conta-email').textContent = IP.email;

  /* Campos de texto simples: id do campo → onde está no objeto perfil */
  $('p-telefone').value = mascaraTelefone(perfil.telefone);
  $('p-area').value = perfil.area || '';
  $('p-resumo').value = perfil.resumo || '';
  $('p-escolaridade').value = perfil.escolaridade || '';
  $('p-disponibilidade').value = perfil.disponibilidade || '';
  $('p-pretensao').value = perfil.pretensao || '';
  $('p-linkedin').value = perfil.linkedin || '';
  $('p-portfolio').value = perfil.portfolio || '';
  $('p-cep').value = mascaraCep(perfil.endereco.cep);
  ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'].forEach(function (k) { $('p-' + k).value = perfil.endereco[k] || ''; });
  $('d-trans').value = perfil.diversidade.trans; $('d-genero').value = perfil.diversidade.genero;
  $('d-pronomes').value = perfil.diversidade.pronomes; $('d-orientacao').value = perfil.diversidade.orientacao;
  $('d-raca').value = perfil.diversidade.raca; $('d-consent').checked = !!perfil.diversidade.consentimento;

  /* Modelo de trabalho (caixas de marcar) */
  $('p-modelos').innerHTML = MODELOS.map(function (m) {
    return '<div class="check-row"><input type="checkbox" name="modelo" id="pm-' + m + '" value="' + m + '"' + (perfil.modelos.indexOf(m) > -1 ? ' checked' : '') + '><label for="pm-' + m + '">' + m + '</label></div>';
  }).join('');

  /* Adaptações e comunicação (mesmo visual que já existia) */
  var checks = function (name, mapa, sel, pre) {
    return Object.keys(mapa).map(function (k) {
      return '<div class="check-row"><input type="checkbox" id="' + pre + '-' + k + '" name="' + name + '" value="' + k + '"' + (sel.indexOf(k) > -1 ? ' checked' : '') + '><label for="' + pre + '-' + k + '">' + mapa[k] + '</label></div>';
    }).join('');
  };
  var COMM = { texto: 'Texto ou e-mail', libras: 'Libras (vídeo)', voz: 'Voz ou telefone' };
  $('p-needs').innerHTML = checks('needs', IP.FEAT, perfil.needs, 'pn');
  $('p-comm').innerHTML = Object.keys(COMM).map(function (k) {
    return '<div class="check-row"><input type="radio" id="pc-' + k + '" name="comm" value="' + k + '"' + (perfil.comm === k ? ' checked' : '') + '><label for="pc-' + k + '">' + COMM[k] + '</label></div>';
  }).join('');

  /* ======================================================================
     5) TIPO DE DEFICIÊNCIA + ESPECIFICAÇÃO + LAUDO
     ====================================================================== */
  /* Para cada tipo: uma caixa de marcar e, escondido logo abaixo, o quadro
     "Especifique" que só aparece quando o tipo é marcado. */
  $('p-pcd').innerHTML = Object.keys(IP.PCD).map(function (k) {
    var marcado = perfil.pcd.indexOf(k) > -1, sel = perfil.pcdDetalhe[k] || [];
    return '<div class="pcd-grupo"><div class="check-row"><input type="checkbox" id="pp-' + k + '" name="pcd" value="' + k + '"' + (marcado ? ' checked' : '') +
      ' aria-controls="det-' + k + '"><label for="pp-' + k + '">' + IP.PCD[k] + '</label></div>' +
      '<div class="pcd-detalhe" id="det-' + k + '"' + (marcado ? '' : ' hidden') + '><fieldset><legend>Especifique: ' + IP.PCD[k] + ' <span class="req">(obrigatório)</span></legend>' +
      DETALHES_PCD[k].map(function (d, i) {
        return '<div class="check-row"><input type="checkbox" id="pd-' + k + '-' + i + '" name="det-' + k + '" value="' + esc(d) + '"' + (sel.indexOf(d) > -1 ? ' checked' : '') + '><label for="pd-' + k + '-' + i + '">' + d + '</label></div>';
      }).join('') +
      '<div class="form-group" style="margin:8px 0 0"><label for="pdo-' + k + '">Outra condição (descreva)</label><div class="input-wrap"><input type="text" id="pdo-' + k + '" maxlength="80" value="' + esc(perfil.pcdOutro[k] || '') + '"></div></div>' +
      '</fieldset></div></div>';
  }).join('');

  /* Marcou/desmarcou um tipo: mostra/esconde o quadro dele e o campo do laudo */
  function atualizarPcdVisivel() {
    var algum = false;
    Object.keys(IP.PCD).forEach(function (k) {
      var on = $('pp-' + k).checked; algum = algum || on;
      $('det-' + k).hidden = !on;
    });
    $('laudo-box').hidden = !algum;
  }
  $('p-pcd').addEventListener('change', function (e) {
    atualizarPcdVisivel();
    if (e.target.name === 'pcd' && e.target.checked) say('Especifique sua condição e envie o laudo médico em PDF.');
  });
  atualizarPcdVisivel();

  /* ---- Laudo médico (PDF) ---- */
  function laudoDesenhar() {
    var l = perfil.laudo;
    $('laudo-info').innerHTML = l
      ? '<p><strong>' + esc(l.nome) + '</strong> · ' + Math.round(l.tam / 1024) + ' KB · enviado em ' + new Date(l.data).toLocaleDateString('pt-BR') +
        '</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">' + (l.url ? '<a class="btn btn-ghost" href="' + l.url + '" download="' + esc(l.nome) + '">Baixar</a>' : '') +
        '<button type="button" class="botao-secundario" style="margin:0" id="laudo-remover">Remover laudo</button></div>'
      : '<p>Nenhum laudo enviado ainda.</p>';
    var r = $('laudo-remover');
    if (r) r.addEventListener('click', function () { perfil.laudo = null; salvar(); laudoDesenhar(); progresso(); say('Laudo removido.'); });
  }
  function laudoMsg(tipo, txt) { var s = $('laudo-status'); s.className = 'form-status show status-' + tipo; s.textContent = txt; }

  $('laudo-arquivo').addEventListener('change', function () {
    var arq = this.files[0], input = this; if (!arq) return;
    /* Regra 1: só PDF. Regra 2: até 5 MB. */
    if (!/\.pdf$/i.test(arq.name) || (arq.type && arq.type !== 'application/pdf')) { laudoMsg('error', 'O laudo precisa ser um arquivo PDF.'); input.value = ''; return; }
    if (arq.size > 5 * 1024 * 1024) { laudoMsg('error', 'O arquivo passa de 5 MB.'); input.value = ''; return; }
    /* Regra 3: confere se o começo do arquivo é mesmo de um PDF (começa com "%PDF") */
    var lerInicio = new FileReader();
    lerInicio.onload = function () {
      if (String(lerInicio.result).indexOf('%PDF') !== 0) { laudoMsg('error', 'Este arquivo não parece ser um PDF válido.'); input.value = ''; return; }
      var concluir = function (url) {
        perfil.laudo = { nome: arq.name, tam: arq.size, data: new Date().toISOString(), url: url || '' };
        if (!salvar()) { perfil.laudo.url = ''; salvar(); }       /* memória cheia: guarda só o nome */
        laudoDesenhar(); progresso(); laudoMsg('success', 'Laudo enviado: ' + arq.name); say('Laudo enviado com sucesso.');
      };
      if (arq.size <= 800 * 1024) { var fr = new FileReader(); fr.onload = function () { concluir(fr.result); }; fr.onerror = function () { concluir(''); }; fr.readAsDataURL(arq); }
      else concluir('');            /* arquivo grande: guardamos só nome e tamanho (limite do localStorage) */
    };
    lerInicio.readAsText(arq.slice(0, 5));
  });
  laudoDesenhar();

  /* ======================================================================
     6) CEP → ENDEREÇO (ViaCEP)
     Quando a pessoa completa 8 dígitos, buscamos rua, bairro, cidade e UF.
     Se a internet falhar, ela pode preencher tudo à mão.
     ====================================================================== */
  function cepMsg(txt) { $('cep-status').textContent = txt; }

  function resumoEndereco() {
    var l = $('p-logradouro').value.trim(), n = $('p-numero').value.trim(), c = $('p-complemento').value.trim(),
        b = $('p-bairro').value.trim(), ci = $('p-cidade').value.trim(), uf = $('p-uf').value.trim().toUpperCase(), cep = $('p-cep').value.trim();
    var linha1 = [l && (l + (n ? ', ' + n : '')), c].filter(Boolean).join(' - ');
    var linha2 = [b, ci && (ci + (uf ? '/' + uf : ''))].filter(Boolean).join(' — ');
    var txt = [linha1, linha2, cep && ('CEP ' + cep)].filter(Boolean).join(' · ');
    $('end-resumo').textContent = txt ? 'Endereço: ' + txt : 'Seu endereço completo aparecerá aqui.';
  }

  function buscarCep(cep) {
    cepMsg('Buscando endereço…');
    fetch('https://viacep.com.br/ws/' + cep + '/json/')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (soDigitos($('p-cep').value) !== cep) return;            /* a pessoa já mudou o CEP: ignora */
        if (d.erro) { cepMsg('CEP não encontrado. Confira os números ou preencha o endereço manualmente.'); return; }
        $('p-logradouro').value = d.logradouro || '';
        $('p-bairro').value = d.bairro || '';
        $('p-cidade').value = d.localidade || '';
        $('p-uf').value = d.uf || '';
        resumoEndereco();
        cepMsg('Endereço encontrado: ' + (d.logradouro ? d.logradouro + ', ' : '') + d.localidade + '/' + d.uf + '. Agora informe o número.');
        say('Endereço preenchido. Informe o número.');
        $('p-numero').focus();
      })
      .catch(function () { cepMsg('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.'); });
  }
  $('p-cep').addEventListener('input', function () {
    this.value = mascaraCep(this.value);
    var d = soDigitos(this.value);
    if (d.length === 8) buscarCep(d); else cepMsg('Digite o CEP e preenchemos o endereço para você.');
    resumoEndereco();
  });
  ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf'].forEach(function (k) { $('p-' + k).addEventListener('input', resumoEndereco); });
  $('p-uf').addEventListener('input', function () { this.value = this.value.replace(/[^a-zA-Z]/g, '').toUpperCase(); });
  $('p-telefone').addEventListener('input', function () { this.value = mascaraTelefone(this.value); });
  resumoEndereco();

  /* ======================================================================
     7) LISTAS E CHIPS (formação, experiência, habilidades...)
     ====================================================================== */
  criarLista({ raiz: 'lista-formacoes', chave: 'formacoes', titulo: 'Formação', botao: 'Adicionar formação', campos: [
    { k: 'curso', rotulo: 'Curso', placeholder: 'Ex.: Análise e Desenvolvimento de Sistemas' },
    { k: 'instituicao', rotulo: 'Instituição' },
    { k: 'situacao', rotulo: 'Situação', tipo: 'select', opcoes: ['Concluído', 'Em andamento', 'Interrompido'] },
    { k: 'ano', rotulo: 'Ano de conclusão (ou previsão)', tipo: 'number', placeholder: '2026' }
  ] });
  criarLista({ raiz: 'lista-experiencias', chave: 'experiencias', titulo: 'Experiência', botao: 'Adicionar experiência', campos: [
    { k: 'cargo', rotulo: 'Cargo' },
    { k: 'empresa', rotulo: 'Empresa' },
    { k: 'inicio', rotulo: 'Início', tipo: 'month' },
    { k: 'fim', rotulo: 'Fim', tipo: 'month' },
    { k: 'atual', rotulo: 'Trabalho aqui atualmente', tipo: 'checkbox' },
    { k: 'descricao', rotulo: 'O que você fazia (atividades e conquistas)', tipo: 'textarea' }
  ] });
  criarLista({ raiz: 'lista-idiomas', chave: 'idiomas', titulo: 'Idioma', botao: 'Adicionar idioma', max: 8, campos: [
    { k: 'idioma', rotulo: 'Idioma', tipo: 'select', opcoes: ['Português', 'Inglês', 'Espanhol', 'Libras', 'Francês', 'Alemão', 'Italiano', 'Outro'] },
    { k: 'nivel', rotulo: 'Nível', tipo: 'select', opcoes: ['Básico', 'Intermediário', 'Avançado', 'Fluente ou nativo'] }
  ] });
  criarLista({ raiz: 'lista-cursos', chave: 'cursos', titulo: 'Curso', botao: 'Adicionar curso ou certificação', campos: [
    { k: 'nome', rotulo: 'Nome do curso ou certificação' },
    { k: 'instituicao', rotulo: 'Instituição' },
    { k: 'ano', rotulo: 'Ano', tipo: 'number', placeholder: '2025' }
  ] });
  criarChips({ raiz: 'chips-habilidades', chave: 'habilidades', rotulo: 'Habilidades técnicas', sugestoes: SUGESTOES_HABILIDADES, placeholder: 'Ex.: Excel, Python, Atendimento' });
  criarChips({ raiz: 'chips-competencias', chave: 'competencias', rotulo: 'Competências comportamentais', sugestoes: SUGESTOES_COMPETENCIAS, placeholder: 'Ex.: Comunicação, Organização' });

  /* ======================================================================
     8) CURRÍCULO (arquivo) — igual ao que já existia
     ====================================================================== */
  function cvDesenhar() {
    var c = perfil.cv;
    $('cv-info').innerHTML = c
      ? '<p><strong>' + esc(c.nome) + '</strong> · ' + Math.round(c.tam / 1024) + ' KB · enviado em ' + new Date(c.data).toLocaleDateString('pt-BR') + '</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
        (c.url ? '<a class="btn btn-ghost" href="' + c.url + '" download="' + esc(c.nome) + '">Baixar</a>' : '') + '<button type="button" class="botao-secundario" style="margin:0" id="cv-remover">Remover currículo</button></div>'
      : '<p>Nenhum currículo enviado ainda.</p>';
    var r = $('cv-remover');
    if (r) r.addEventListener('click', function () { perfil.cv = null; salvar(); cvDesenhar(); progresso(); say('Currículo removido.'); });
  }
  $('cv-arquivo').addEventListener('change', function () {
    var arq = this.files[0], st = $('cv-status'); if (!arq) return;
    st.className = 'form-status';
    if (!/\.(pdf|docx?)$/i.test(arq.name)) { st.className = 'form-status show status-error'; st.textContent = 'Envie um arquivo PDF, DOC ou DOCX.'; return; }
    if (arq.size > 5 * 1024 * 1024) { st.className = 'form-status show status-error'; st.textContent = 'O arquivo passa de 5 MB.'; return; }
    var concluir = function (url) {
      perfil.cv = { nome: arq.name, tam: arq.size, data: new Date().toISOString(), url: url || '' };
      if (!salvar()) { perfil.cv.url = ''; salvar(); }
      cvDesenhar(); progresso();
      st.className = 'form-status show status-success'; st.textContent = 'Currículo enviado: ' + arq.name; say('Currículo enviado com sucesso.');
    };
    if (arq.size <= 800 * 1024) { var fr = new FileReader(); fr.onload = function () { concluir(fr.result); }; fr.onerror = function () { concluir(''); }; fr.readAsDataURL(arq); } else concluir('');
  });

  /* ======================================================================
     9) PROGRESSO DO PERFIL (0 a 100%) e lista do que falta
     ====================================================================== */
  /* A pontuação (cada item vale pontos; máximo 100) fica em app.js: IP.pontosPerfil() */
  function pontos() { return IP.pontosPerfil(perfil); }
  /* O que é OBRIGATÓRIO para se candidatar a uma vaga */
  function faltando() {
    var m = [];
    if (!perfil.telefone) m.push('Telefone');
    if (!perfil.cidade) m.push('Endereço (CEP)');
    if (!perfil.area) m.push('Área ou cargo de interesse');
    if (!perfil.cv) m.push('Currículo (arquivo PDF ou Word)');
    if (perfil.pcd.length && !perfil.laudo) m.push('Laudo médico em PDF');
    return m;
  }
  function progresso() {
    var p = pontos();
    $('progresso-barra').setAttribute('aria-valuenow', p);
    $('progresso-barra').firstElementChild.style.width = p + '%';
    $('progresso-texto').textContent = p + '% completo';
    var m = faltando();
    $('perfil-falta').textContent = m.length ? 'Obrigatório para se candidatar: ' + m.join(', ') + '.' : 'Perfil pronto para se candidatar.';
  }
  cvDesenhar(); progresso();

  /* ======================================================================
     10) SALVAR O PERFIL (botão "Salvar perfil")
     Primeiro valida; se estiver tudo certo, copia os campos para "perfil"
     e grava no localStorage.
     ====================================================================== */
  var voltar = new URLSearchParams(location.search).get('voltar');
  var form = $('perfil-form');

  /* Pega os valores marcados de um grupo de caixas (ex.: name="needs") */
  var marcados = function (nome) {
    return Array.prototype.map.call(form.querySelectorAll('input[name="' + nome + '"]:checked'), function (i) { return i.value; });
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var st = $('perfil-status');
    /* mostra o erro, leva o foco ao campo com problema e avisa leitores de tela */
    function erro(txt, campo) {
      st.className = 'form-status show status-error'; st.textContent = txt;
      if (campo) campo.focus(); else st.focus();
      say(txt);
    }

    /* ---- Validações ---- */
    var tel = soDigitos($('p-telefone').value);
    if (tel && (tel.length < 10 || tel.length > 11)) return erro('Digite o telefone com DDD, por exemplo (11) 91234-5678.', $('p-telefone'));

    var cep = soDigitos($('p-cep').value);
    if (cep && cep.length !== 8) return erro('O CEP precisa ter 8 números.', $('p-cep'));
    if (cep && !$('p-numero').value.trim()) return erro('Informe o número do endereço (ou "S/N" se não houver).', $('p-numero'));

    var tipos = marcados('pcd');
    for (var i = 0; i < tipos.length; i++) {       /* cada tipo marcado precisa de uma especificação */
      var k = tipos[i], temDet = marcados('det-' + k).length > 0, temOutro = $('pdo-' + k).value.trim() !== '';
      if (!temDet && !temOutro) return erro('Especifique sua condição em "' + IP.PCD[k] + '": marque uma opção ou descreva em "Outra condição".', $('pp-' + k));
    }
    if (tipos.length && !perfil.laudo) return erro('Envie o laudo médico em PDF para concluir o perfil de acessibilidade.', $('laudo-arquivo'));

    var urlOk = function (v) { return !v || /^https?:\/\/\S+\.\S+/.test(v); };
    if (!urlOk($('p-linkedin').value.trim())) return erro('O link do LinkedIn deve começar com https://', $('p-linkedin'));
    if (!urlOk($('p-portfolio').value.trim())) return erro('O link do portfólio deve começar com https://', $('p-portfolio'));

    /* ---- Tudo certo: copia os campos para o objeto "perfil" ---- */
    perfil.telefone = $('p-telefone').value.trim();
    perfil.area = $('p-area').value.trim();
    perfil.resumo = $('p-resumo').value.trim();
    perfil.escolaridade = $('p-escolaridade').value;
    perfil.disponibilidade = $('p-disponibilidade').value;
    perfil.pretensao = soDigitos($('p-pretensao').value);
    perfil.linkedin = $('p-linkedin').value.trim();
    perfil.portfolio = $('p-portfolio').value.trim();
    perfil.modelos = marcados('modelo');
    perfil.needs = marcados('needs');
    perfil.comm = marcados('comm')[0] || '';

    perfil.endereco = {
      cep: cep ? mascaraCep(cep) : '', logradouro: $('p-logradouro').value.trim(), numero: $('p-numero').value.trim(),
      complemento: $('p-complemento').value.trim(), bairro: $('p-bairro').value.trim(),
      cidade: $('p-cidade').value.trim(), uf: $('p-uf').value.trim().toUpperCase()
    };
    /* "cidade" no formato "Campinas, SP" continua sendo usado pelas vagas recomendadas */
    perfil.cidade = perfil.endereco.cidade ? perfil.endereco.cidade + (perfil.endereco.uf ? ', ' + perfil.endereco.uf : '') : '';

    perfil.pcd = tipos; perfil.pcdDetalhe = {}; perfil.pcdOutro = {};
    tipos.forEach(function (k) { perfil.pcdDetalhe[k] = marcados('det-' + k); perfil.pcdOutro[k] = $('pdo-' + k).value.trim(); });
    if (!tipos.length) perfil.laudo = null;      /* sem deficiência marcada: não guardamos laudo (privacidade) */

    perfil.diversidade = {
      trans: $('d-trans').value, genero: $('d-genero').value, pronomes: $('d-pronomes').value,
      orientacao: $('d-orientacao').value, raca: $('d-raca').value, consentimento: $('d-consent').checked
    };

    /* ---- Grava ---- */
    if (!salvar()) return erro('Não foi possível salvar: a memória do navegador está cheia. Remova o currículo ou o laudo e envie um arquivo menor.');
    laudoDesenhar(); progresso();
    st.className = 'form-status show status-success';
    st.innerHTML = 'Perfil salvo.' + (voltar && !faltando().length ? ' <a href="vagas.html?vaga=' + esc(voltar) + '"><u>Voltar para a vaga e candidatar-se</u></a>' : '');
    st.focus();
    say('Perfil salvo.');
  });
});
