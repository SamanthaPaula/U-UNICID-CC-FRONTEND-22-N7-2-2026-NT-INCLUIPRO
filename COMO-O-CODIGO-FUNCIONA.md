# Como o código do IncluiPro funciona (guia para entender)

## Onde as contas são salvas? (sua dúvida)
**No navegador, no `localStorage`.** Não existe banco de dados. Cada navegador/computador tem a sua própria "gaveta":

| Chave no localStorage | O que guarda |
|---|---|
| `incluipro_users` | lista de contas (nome, e-mail, senha com hash) |
| `incluipro_session` | e-mail de quem está logado agora |
| `incluipro_pending_verification` | cadastro esperando o código do e-mail |
| `incluipro_perfil_<email>` | perfil, currículo, laudo, endereço, habilidades... |
| `incluipro_cands_<email>` / `_salvas_` / `_msgs_` | candidaturas, vagas salvas, mensagens |
| `incluipro_avaliacoes` | avaliações de empresas |

**Por que "bloqueia" ao testar de novo?** Porque o e-mail que você cadastrou continua salvo em `incluipro_users`, então o site diz que ele já existe. Para recomeçar:
- abra **`limpar-dados-teste.html`** (apaga uma conta ou tudo), **ou**
- F12 → aba *Application* → *Local Storage* → apague as chaves que começam com `incluipro_`, **ou**
- teste com uma janela anônima.
(Apague `limpar-dados-teste.html` antes de publicar.)

## Mapa dos arquivos
| Arquivo | Função |
|---|---|
| `js/nav.js` | menu do topo em todas as páginas + **porteiro** (páginas com `data-protegida` exigem login) |
| `js/auth.js` | cadastro, código por e-mail, login; **configuração do EmailJS no topo** |
| `js/app.js` | vagas, candidaturas, mensagens, logos das empresas, `window.IP` (ferramentas compartilhadas) |
| `js/perfil.js` | página Meu perfil (CEP, deficiência + laudo, habilidades, diversidade...) |
| `js/paginas.js` | empresas, avaliações e formulário de contato |
| `js/script.js` | recursos de acessibilidade (letra, contraste, leitura em voz) |
| `css/style.css` | todo o visual |

## Como funciona o "login obrigatório"
1. Páginas como `vagas.html` têm `<body data-protegida>` e um pequeno script no `<head>` que confere se há login.
2. Sem login → vai para `entrar.html?next=vagas.html`.
3. Depois de entrar (ou cadastrar + confirmar o e-mail), volta para a página do `?next=`.

## Convites que somem para quem já está logado
Qualquer elemento com o atributo `data-so-deslogado` é removido pelo `nav.js` quando há login.

## Logos das empresas
Ordem: `img/empresas/<id>.png` → ícone do site da empresa → letra inicial. Coloque os PNG oficiais em `img/empresas/` (veja o LEIAME lá).

## E-mails (EmailJS) — duas coisas diferentes
No topo de `js/auth.js`, objeto `INCLUIPRO_EMAIL`:
- `templateId` → e-mail do **código de verificação** (cadastro)
- `contatoTemplateId` → e-mail do **formulário de contato** (vai para `contatoDestino` = samanthapaulaa@gmail.com)
Veja `LEIAME-EMAIL.md`. Sem EmailJS, o contato abre o app de e-mail da pessoa já endereçado a samanthapaulaa@gmail.com.

## Libras (VLibras)
`js/script.js` carrega o tradutor oficial do governo (vlibras.gov.br): aparece o botão de Libras na lateral direita de todas as páginas; ao clicar, um avatar 3D traduz o texto selecionado. O botão "Abrir tradutor de Libras" do painel de acessibilidade abre o mesmo avatar. Precisa de internet.

## Contato
`js/paginas.js` tenta, nesta ordem: EmailJS (se configurado) → FormSubmit (padrão, grátis, exige ativação única) → abrir o app de e-mail da pessoa.

## Responsividade
Bloco "RESPONSIVIDADE" no fim de `css/style.css`: grids viram 1 coluna até 900px, ajustes de espaçamento e toque até 600px, e regras `min-width:0` que impedem rolagem horizontal. Testado de 320px a 1440px.

## Limites desta versão (protótipo)
- Dados só no navegador; não sincronizam entre aparelhos.
- Laudo, currículo e dados de diversidade são **dados sensíveis (LGPD)**. Guardados no navegador servem só para demonstração; em produção precisam de banco com criptografia, consentimento e controle de acesso.
- O código de verificação é conferido no navegador. Em produção, valide no servidor.
