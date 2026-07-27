# Plano de cinco sprints — fechamento de lacunas

**Referência:** levantamento técnico de 27/07/2026
**Cadência sugerida:** 2 semanas por sprint; o prazo pressupõe uma pessoa de front-end, uma de back-end e QA compartilhado.
**Meta de produto:** lançar o marketplace web com segurança e disponibilizar um aplicativo mobile realmente integrado à mesma plataforma.

## Princípios de execução

- Não lançar o aplicativo mobile enquanto autenticação e chat não passarem pelos critérios de aceite.
- Tratar o web como produto de lançamento inicial; o mobile é uma segunda superfície do mesmo fluxo, não um produto paralelo.
- Não introduzir pagamentos nesta trilha. A contratação continuará direta; monetização é decidida no plano comercial.
- Toda sprint termina com evidência: comandos executados, testes, ambiente usado e decisão de release.

## Sprint 1 — Base confiável de desenvolvimento e testes

**Objetivo:** tornar o repositório, a documentação e a validação reproduzíveis antes de alterar fluxos de negócio.

### Back-end, infraestrutura e documentação

- Corrigir a documentação para refletir Ably no chat web; remover referências ao servidor WebSocket próprio e a `server.ts` inexistente.
- Documentar corretamente o comportamento de upload: novos documentos e anexos requerem WordPress configurado; o fallback local é legado de leitura, não fallback de escrita.
- Consolidar `.env.exemple`, README e `spec.md`, incluindo `ABLY_API_KEY`, WordPress, Resend, Expo, Sentry e variáveis de release.
- Isolar o Playwright em porta própria e impedir `reuseExistingServer` em desenvolvimento quando o processo na porta não for o Cuidou.
- Criar comandos de validação separados para web, API e mobile; registrar versões de Node, npm, Expo e Maestro.

### Front-end e QA

- Corrigir os testes E2E básicos para usarem a instância correta da aplicação.
- Criar dados de teste determinísticos para família, profissional e admin, sem depender de banco ou sessão local de outro projeto.
- Documentar o fluxo manual mínimo de smoke: cadastro, aprovação, vaga, candidatura, aceite, chat, contrato e avaliação.

### Critérios de aceite

- `npm run lint`, `npm run typecheck`, `npm test` e `npm run test:e2e` executam contra o Cuidou e têm resultado reproduzível.
- A documentação não promete WebSocket próprio nem fallback de upload inexistente.
- Um novo integrante consegue configurar ambiente de desenvolvimento apenas pelo README.

## Sprint 2 — Autenticação e sessão mobile reais

**Objetivo:** fazer o app Expo autenticar e consumir a API protegida com o mesmo modelo de autorização do web.

**Status de implementação (27/07/2026):** concluída a base de autenticação mobile por email/senha, sessão Bearer, refresh token rotativo, logout e sincronização de sessão no Expo. Google permanece condicionado à configuração dos clientes e do provedor no ambiente.

### Back-end

- Definir e implementar o contrato mobile: login por senha, login Google, refresh, sessão e logout para `/api/mobile/auth/*`, ou adaptar o app ao protocolo oficialmente suportado pelo Auth.js. A decisão deve ser única e documentada.
- Emitir access token e refresh token seguros, com expiração, rotação, revogação no logout e armazenamento de sessão no banco quando necessário.
- Validar token Bearer em todos os endpoints já usados pelo mobile e cobrir contas pendentes, suspensas e banidas.
- Implementar testes de contrato para cada endpoint de autenticação e testes de autorização por papel.

### Mobile

- Adequar `auth-repository`, `AuthProvider`, armazenamento seguro e renovação de sessão ao contrato escolhido.
- Validar login por senha, logout, reabertura do app, expiração de token, onboarding e mensagens de aprovação pendente.
- Concluir login Google somente após existir configuração de clientes iOS, Android e web; manter botão indisponível com mensagem clara quando não configurado.

### Critérios de aceite

- Um usuário aprovado consegue entrar no app, fechar/abrir o app e manter sessão válida.
- Família, profissional e admin veem apenas suas rotas e APIs autorizadas.
- Os três fluxos Maestro deixam de assumir autenticação fictícia e executam com contas de teste controladas.

## Sprint 3 — Chat, push e integrações externas

**Objetivo:** unificar o comportamento em tempo real entre web e mobile e tornar notificações acionáveis.

### Back-end e integrações

- Padronizar o chat em Ably para todas as plataformas: endpoint retorna `tokenRequest`, autorização limitada à conversa e publicação ocorre após persistência da mensagem.
- Configurar e validar `ABLY_API_KEY`, WordPress, Resend e Expo Push por ambiente; health check deve expor estado degradado sem vazar segredos.
- Criar política de falhas para serviços externos: log estruturado, reprocessamento quando aplicável e alerta operacional.
- Verificar upload/download de anexos, MIME, tamanho, autorização e links de mídia.

### Mobile e front-end web

- Substituir WebSocket manual do mobile pelo cliente Ably e remover a expectativa de `/ws?token=...`.
- Corrigir o contrato do token de chat no repositório mobile.
- Corrigir roteamento de push: `APPLICATION_STATUS_UPDATED` da família deve levar ao pipeline; validar todas as notificações declaradas.
- Exibir estado de conexão/reconexão do chat de forma compreensível em web e mobile.

### Critérios de aceite

- Mensagem enviada no web chega no mobile e vice-versa, sem duplicação, após aceite de candidatura.
- Push registrado por usuário autenticado abre a rota correta em cold start e em segundo plano.
- Anexo de imagem/PDF é enviado, listado e baixado apenas pelos participantes autorizados.

## Sprint 4 — Fechamento dos fluxos de marketplace

**Objetivo:** transformar os recursos já existentes em jornadas completas, sem becos sem saída.

### Back-end

- Implementar retirada de candidatura pelo profissional (`WITHDRAWN`) e validar as transições permitidas do pipeline.
- Revisar regras de aceite, convite, expiração, pausa/fechamento de vaga, cancelamento e conclusão de contrato para garantir idempotência e auditoria.
- Validar que apenas documentos verificados geram o selo de confiança exibido no marketplace.
- Criar endpoints/métricas de funil: cadastro aprovado, perfil completo, vaga publicada, candidatura, aceite e contrato concluído.

### Front-end web e mobile

- Tornar explícitos os estados vazios, pendentes, expirados, rejeitados, retirados e bloqueados.
- Revisar formulários de perfil, vaga, convite e contrato para mensagens de erro, confirmação e acessibilidade.
- Fechar a experiência de avaliação bilateral e a orientação pós-conclusão de contrato.
- Fazer a landing page e o marketplace refletirem dados reais, sem promessas que a operação ainda não sustenta.

### QA

- Criar E2E autenticado do fluxo principal em web e testes de integração da API para transições de estado.
- Executar Maestro: login, criação de vaga, candidatura, convite, chat e notificação.

### Critérios de aceite

- Família e profissional concluem o ciclo completo sem intervenção de banco ou admin técnico.
- Nenhuma transição inválida cria contrato, conversa ou contato liberado.
- Painel admin mostra os eventos e decisões relevantes para suporte.

## Sprint 5 — Release, segurança operacional e preparação comercial

**Objetivo:** converter o MVP em produto lançável, mensurável e pronto para piloto comercial controlado.

### Engenharia e operação

- Executar o checklist de release integralmente em ambiente de homologação e produção.
- Fazer revisão de segurança: secrets, rate limit, autorização por papel, uploads, auditoria, dependências e política de backup/restauração.
- Adicionar monitoramento de erro e desempenho web/mobile, alertas de falha de integração e runbook de incidente.
- Medir Lighthouse, tempos de API e comportamento de listas/chat em dispositivos intermediários.
- Definir processo de migration, rollback, versionamento EAS e publicação em lojas; realizar build de preview antes de produção.

### Produto e comercial

- Instrumentar eventos de funil e criar painel inicial: aquisição, ativação, candidaturas, aceite, tempo até contratação, retenção e denúncias.
- Implementar captura de lead/newsletter ou lista de espera, hoje apenas visual na landing page.
- Preparar termos operacionais, canal de suporte, SLA de revisão de documentos e protocolo de incidentes de segurança.
- Rodar piloto em uma única cidade/região e com uma categoria inicial, medindo liquidez antes de expandir.

### Critérios de aceite

- Release web aprovado por checklist e ambiente de produção com health check, observabilidade e rollback testados.
- Build mobile de preview aprovado em iOS e Android; produção apenas depois dos fluxos críticos passarem.
- Painel comercial mede o funil de ponta a ponta e há uma hipótese de monetização testável.

## Dependências e decisão de go/no-go

| Após | Decisão |
|---|---|
| Sprint 1 | Código e testes são reproduzíveis? Se não, não iniciar novas features. |
| Sprint 2 | Mobile autentica com segurança? Se não, manter lançamento web-only. |
| Sprint 3 | Chat/push cruzado funciona? Se não, mobile continua em beta interno. |
| Sprint 4 | Fluxo de contratação termina sem suporte manual? Se não, limitar piloto. |
| Sprint 5 | Métricas, suporte e operação estão ativos? Se sim, lançar piloto pago. |
