# IncluiPro — Talento sem Barreiras
**Plataforma de empregabilidade para Pessoas com Deficiência (PcD)**
> Desenvolvida pela equipe **Pixel Devs**
## 1. Identificação

| Campo | Informação |
|---|---|
| **Nome do projeto/site** | IncluiPro|
| **Nome da equipe** | Pixel Devs |
| **Disciplina** | Desenvolvimento front-end para web |
| **Instituição** | Universidade Cidade de São Paulo — UNICID |
| **Professor** | _Paulo Sergio Fratta Junior_ |

### Integrantes

| Nº | Nome | Função na equipe |
|---|---|---|
| 1 | _ANA BEATRIZ MENDES GONÇALVES_ | __ |
| 2 | _ARTHUR GABRIEL MARTINS DA COSTA_ | _preencher_ |
| 3 | _FELIPE PEREIRA VESCIA_ | _preencher_ |
| 4 | _LUIZ GUSTAVO SANTOS DE OLIVEIRA_ | _preencher_ |
| 5 | _ROGINER HAIZ DOS SANTOS_ | _preencher_ |
 6 | _SAMANTHA PAULA DOS SANTOS SILVA_ | _preencher_ |
---
## 2. Visão geral

O **IncluiPro** é um projeto de site voltado a aproximar pessoas com deficiência de oportunidades de trabalho, oferecendo informações mais claras sobre as condições de acessibilidade das vagas e recursos que ajudam a pessoa candidata a navegar e participar do processo seletivo.

O projeto reúne páginas institucionais, cadastro de usuário, autenticação demonstrativa, criação de perfil e currículo, catálogo de vagas inclusivas, acompanhamento de candidaturas, mensagens simuladas e informações sobre direitos das pessoas com deficiência.

**Estado do projeto:** protótipo front-end funcional. As vagas, empresas e interações de recrutamento são dados de demonstração; não há integração comprovada com sistemas reais das empresas citadas.

## 3. Problema que o projeto procura resolver

Pessoas com deficiência podem encontrar barreiras na busca por emprego, incluindo descrições de vagas que não informam adaptações disponíveis, dificuldades de navegação, pouca transparência sobre as etapas seletivas e falta de um espaço centralizado para apresentar necessidades de acessibilidade.

O IncluiPro propõe uma experiência que evidencia as condições de acessibilidade da oportunidade, permite registrar adaptações solicitadas na candidatura e oferece recursos de navegação assistiva. O propósito é apoiar uma busca de emprego mais informada e inclusiva.

## 4. Objetivos

### Objetivo geral

Desenvolver uma interface web acessível para facilitar a consulta de vagas inclusivas e a organização de candidaturas de pessoas com deficiência.

### Objetivos específicos

- Apresentar oportunidades com informações sobre modalidade de trabalho, remuneração e acessibilidade.
- Permitir cadastro, verificação demonstrativa de e-mail e entrada na plataforma.
- Oferecer preenchimento de perfil, experiências, formação, habilidades e currículo.
- Possibilitar busca, filtros, ordenação e salvamento de vagas.
- Registrar candidaturas e solicitações de adaptação para o processo seletivo.
- Exibir uma simulação de acompanhamento de etapas e conversas.
- Disponibilizar controles de acessibilidade e informações sobre direitos PcD.
- Organizar a interface para telas de diferentes tamanhos.

## 5. Público-alvo

**Público principal:** pessoas com deficiência que buscam oportunidades de emprego, com ou sem experiência profissional.

Tipos de deficiência considerados na plataforma:

- Deficiência visual
- Deficiência auditiva / surdez
- Deficiência física
- Deficiência intelectual
- Autismo (TEA)
- Deficiência múltipla

**Públicos secundários:**

- Empresas que desejam divulgar vagas inclusivas;
- Profissionais de recrutamento e seleção;
- Pessoas interessadas em conhecer direitos e legislação ligados à empregabilidade PcD.

---


## 6. Tecnologias e arquitetura

| Tecnologia ou serviço | Aplicação no projeto |
| --- | --- |
| HTML5 | Estrutura das páginas, formulários, seções e elementos semânticos. |
| CSS3 | Identidade visual, responsividade, estados visuais e apresentação dos componentes. |
| JavaScript | Navegação, validações, filtros, armazenamento, acessibilidade e lógica das páginas. |
| `localStorage` | Persistência local de contas, sessão, perfil, candidaturas, mensagens e avaliações. |
| EmailJS | Tentativa de envio de códigos de verificação e mensagens de contato, mediante serviço configurado. |
| FormSubmit | Alternativa de envio do formulário de contato, sujeita à ativação/configuração. |
| ViaCEP | Consulta de endereço a partir do CEP informado no perfil. |
| VLibras | Widget externo de tradução de conteúdo para Libras. |
| Web Speech API | Leitura em voz alta por meio dos recursos disponíveis no navegador. |

### 6.1 Páginas do sistema

| Nº | Página | Arquivo | Acesso | Função |
|---|---|---|---|---|
| 1 | Início | `index.html` | Livre | Apresentação, passos, vagas recomendadas, leis e depoimentos |
| 2 | Como funciona | `como-funciona.html` | Livre | Passo a passo, diferenciais, perguntas frequentes, privacidade e termos de uso (resumo) |
| 3 | Sobre nós | `sobre.html` | Livre | Equipe Pixel Devs, sobre o projeto, integrantes e formulário de contato |
| 4 | Cadastro | `cadastro.html` | Livre | Criação de conta |
| 5 | Confirmar e-mail | `verificar.html` | Livre | Digitação do código de 6 dígitos enviado por e-mail |
| 6 | Entrar | `entrar.html` | Livre | Login |
| 7 | Meu painel | `painel.html` | Livre* | Resumo da conta, vagas recomendadas e progresso do perfil |
| 8 | Meu perfil | `perfil.html` |  Login | Currículo, objetivo profissional, formação, habilidades e perfil de acessibilidade |
| 9 | Vagas | `vagas.html` | Login | Lista, recomendações, busca, filtros e candidatura |
| 10 | Empresas | `empresas.html` | Login | Lista de empresas com busca |
| 11 | Empresa | `empresa.html` | Login | Detalhes, vagas abertas e avaliações da empresa |
| 12 | Minhas vagas | `candidaturas.html` | Login | Vagas salvas, candidaturas, entrevistas e arquivadas |
| 13 | Mensagens | `mensagens.html` | Login | Conversas com as empresas |
| 14 | Leis e direitos PcD | `leis.html` | Login | Direitos, Lei de Cotas, inclusão profissional e fontes oficiais |

\* O `painel.html` não está marcado como protegido (`data-protegida`) e não aparece no menu principal. Veja [Pendências](#13-riscos-restrições-e-limitações).

**Arquivo auxiliar (não faz parte do produto):** `limpar-dados-teste.html` apaga contas e dados de teste do navegador. **Deve ser removido antes da publicação final.**
```
