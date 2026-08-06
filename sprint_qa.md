# Plano de 3 Sprints — prontidão para homologação E2E

## Objetivo

Deixar o ambiente de homologação apto para o QA validar, de ponta a ponta, as jornadas web (Next.js), API e aplicativo mobile (Expo), com dados isolados, integrações configuradas e evidências reproduzíveis.

Este plano **não é um plano de produção**. Toda execução deverá ocorrer em infraestrutura, contas de integração e credenciais próprias de homologação.

## Escopo de aceitação final

Ao final da Sprint 3, o QA deve conseguir executar, no mínimo:

- cadastro e login de família e profissional;
- criação, edição e publicação de vaga;
- candidatura, retirada, aceite/rejeição e convite;
- criação, cancelamento e conclusão de contrato;
- chat, anexos, notificações e avaliação;
- envio e moderação de documentos, denúncias e administração;
- listas de espera, métricas/eventos e telas administrativas;
- os fluxos equivalentes no aplicativo Android/iOS de preview.

## Premissas e regras comuns

- Usar banco PostgreSQL e URL pública HTTPS exclusivos de homologação; nunca apontar testes destrutivos para produção.
- Manter contas de teste por papel (família, profissional e admin), com dados conhecidos e reinicializáveis.
- Guardar segredos exclusivamente no provedor de ambiente/EAS; não versioná-los em `.env`, testes ou relatórios.
- Cada sprint só é concluída após os critérios de aceite e o gate de saída terem evidência registrada.
- Falhas de integração externa (Ably, WordPress, Resend, Expo Push, Google) bloqueiam somente a jornada que dependem delas, mas devem ser visíveis no health check e no relatório de QA.

---

# Sprint 1 — Ambiente de homologação e banco consistente

## Objetivo

Eliminar o bloqueio de schema e disponibilizar um ambiente compartilhado, observável e seguro para os testes autenticados de web e mobile.

## Problemas atacados

- O banco configurado possui migrations pendentes, incluindo `WaitlistLead` e `ProductEvent`.
- Build e Playwright registraram erros de tabelas inexistentes, mesmo com código compilando.
- Não há uma base de dados de QA comprovadamente migrada, semeada e monitorada.

## Escopo de implementação

1. **Preparar o ambiente de homologação**
   - Criar/confirmar banco e projeto de deploy exclusivos de homologação.
   - Configurar URL pública HTTPS e `NEXT_PUBLIC_APP_URL` com o domínio de homologação.
   - Configurar `AUTH_SECRET`, banco, Ably, WordPress, Resend, Upstash e variáveis `EXPO_PUBLIC_*` específicas do ambiente.
   - Definir contas/caixas de e-mail de teste e a política de limpeza de dados de QA.

2. **Aplicar e conferir o schema**
   - Fazer backup/snapshot do banco alvo antes da alteração.
   - Executar `npm run prisma:migrate:deploy` no pipeline/ambiente de homologação.
   - Confirmar, com `npx prisma migrate status`, que nenhuma migration está pendente ou falhou.
   - Conferir especialmente as migrations pendentes atuais:
     - `20260401145107_first`;
     - `20260408170000_push_token_idempotent`;
     - `20260727130000_mobile_auth_sessions`;
     - `20260727140000_sprint4_application_withdrawal`;
     - `20260727150000_sprint4_invitation_audit`;
     - `20260727160000_sprint5_waitlist_leads`;
     - `20260727161000_sprint5_product_events`;
     - `20260727162000_pending_user_default`.

3. **Dados e verificação operacional**
   - Executar ou adaptar o seed para criar família, profissional e admin de QA, sem depender de credenciais de desenvolvimento.
   - Criar dados mínimos para marketplace, vaga, candidatura, convite, contrato e conversa quando necessários aos testes.
   - Rodar `npm run check:release` apontado ao domínio de homologação e validar `/api/health` com `db: "ok"`.
   - Validar manualmente as telas de leads, métricas e administração que usam `WaitlistLead` e `ProductEvent`.
   - Registrar procedimento de rollback: snapshot, causa, responsável e como impedir nova gravação durante a reversão.

## Critérios de aceite

- [ ] Todas as migrations aparecem como aplicadas no banco de homologação.
- [ ] Não há erro de `table does not exist` para `WaitlistLead` ou `ProductEvent` no build, smoke test ou logs do servidor.
- [ ] `/api/health` retorna HTTP 200, `status: "ok"` e `db: "ok"`.
- [ ] Há contas de QA documentadas para os três papéis e dados suficientes para iniciar os fluxos.
- [ ] Leads e métricas administrativas carregam e persistem eventos no ambiente de homologação.
- [ ] Existe snapshot/backup anterior à migration e rollback validado documentalmente.

## Gate de saída

Somente iniciar a Sprint 2 após `prisma migrate status`, health check e smoke manual de leads/admin estarem aprovados no **domínio de homologação**, não apenas localmente.

---

# Sprint 2 — Cobertura E2E autenticada de web e API

## Objetivo

Transformar os testes atuais de smoke/contrato em uma suíte que comprove as jornadas de negócio no ambiente de homologação, com isolamento e relatório consumível pelo QA.

## Problemas atacados

- Os Playwrights atuais cobrem predominantemente páginas públicas, validações e respostas sem autenticação.
- O teste autenticado está condicionado a `RUN_AUTH_E2E`, `AUTH_E2E_EMAIL` e `AUTH_E2E_PASSWORD`, portanto não roda por padrão.
- Não existem evidências automatizadas para os ciclos críticos entre família, profissional e administração.

## Escopo de implementação

1. **Fundação de dados e autenticação E2E**
   - Criar um mecanismo seguro para preparar e limpar massa de testes no banco de homologação: seed idempotente, API interna protegida ou fixture controlada.
   - Provisionar credenciais de teste no cofre do CI; nunca usar senha em arquivo versionado.
   - Criar helpers Playwright por papel e reutilizar sessões autenticadas (`storageState` ou login de API validado).
   - Configurar execução explícita contra `PLAYWRIGHT_BASE_URL` da homologação e impedir que a suíte autenticada rode contra produção.

2. **Jornadas de negócio obrigatórias**
   - Família: cadastro/login, perfil, criar/editar/publicar vaga, convidar profissional e acompanhar pipeline.
   - Profissional: cadastro/login, perfil/disponibilidade, candidatura, retirada, aceitar/recusar convite e documentos.
   - Ciclo compartilhado: candidatura → decisão da família → convite/aceite → contrato → conclusão/cancelamento → avaliação.
   - Chat: criação/acesso de conversa, mensagem e anexo; confirmar autorização entre participantes.
   - Administração: login, aprovação/moderação de usuário e documento, denúncia, auditoria, leads e métricas.
   - Integrações: testar resultado funcional de e-mail, WordPress e Ably quando a credencial de homologação estiver disponível; marcar explicitamente como bloqueada se a dependência estiver indisponível.

3. **Qualidade da suíte e evidências**
   - Fazer cada teste criar identificadores próprios e limpar apenas os dados que criou.
   - Garantir que uma resposta 5xx falhe o teste, mesmo quando cabeçalhos esperados estejam presentes.
   - Separar smoke público, contrato de API e E2E autenticado em comandos claros no `package.json` e no CI.
   - Publicar relatório HTML, traces, screenshots/vídeos de falha e resumo de cenários para o QA.
   - Adicionar a suíte autenticada ao pipeline de homologação com variáveis protegidas.

## Critérios de aceite

- [ ] A suíte autenticada roda automaticamente no ambiente de homologação e não fica `skip` por falta de configuração.
- [ ] Cada jornada obrigatória acima possui pelo menos um cenário feliz e as transições negativas mais críticas (ex.: vaga fechada, convite terminal, usuário sem permissão).
- [ ] Testes que geram dados são repetíveis e não contaminam execuções posteriores.
- [ ] Nenhum 5xx ou erro Prisma ocorre nos logs durante a execução bem-sucedida.
- [ ] Relatório Playwright e evidências de falha ficam acessíveis à equipe de QA.
- [ ] `lint`, `typecheck`, testes unitários, build e as suítes E2E aprovam no commit candidato à homologação.

## Gate de saída

QA executa uma rodada guiada no navegador com as contas de teste e reproduz os resultados dos cenários automatizados. Falhas em chat, documento, contrato, moderação ou admin bloqueiam a Sprint 3 como aceite final de homologação.

---

# Sprint 3 — Estabilização do Expo e validação mobile real

## Objetivo

Produzir builds preview instaláveis e validar o aplicativo nativo contra a API HTTPS de homologação, em emulador e dispositivos reais.

## Problemas atacados

- Expo Doctor identificou dependências nativas duplicadas e incompatibilidades com o SDK 54, entre elas `expo-auth-session`, `expo-document-picker`, `expo-secure-store` e Sentry.
- Não há evidência de build preview nem dos fluxos Maestro em dispositivo/emulador.
- A configuração padrão do app usa `localhost`, inadequado para aparelhos físicos de QA.

## Escopo de implementação

1. **Compatibilidade e determinismo do projeto Expo**
   - Alinhar dependências à versão exigida pelo Expo SDK usando `npx expo install --check` e as versões recomendadas; deduplicar módulos nativos.
   - Atualizar `package-lock.json` e registrar qualquer dependência deliberadamente excluída da validação do Expo.
   - Fazer `npx expo-doctor` passar sem falhas e executar lint/typecheck mobile de forma previsível no CI.
   - Confirmar que as dependências de autenticação, documentos, notificações e Sentry estão compatíveis com a mesma SDK.

2. **Configuração de homologação para o binário**
   - Definir perfil `preview` do EAS com `EXPO_PUBLIC_API_BASE_URL=https://<dominio-de-homologacao>` e demais chaves públicas necessárias.
   - Impedir que builds `preview`/`production` usem `localhost`; permitir esse fallback somente em desenvolvimento local.
   - Configurar IDs OAuth, DSN Sentry e identificador de release de homologação sem expor valores sensíveis no repositório.
   - Validar que Android e iOS conseguem alcançar `/api/health` e efetuar login usando a URL configurada.

3. **Build, instalação e automação mobile**
   - Gerar builds EAS `preview` para Android e iOS e registrar links/artefatos e versão/build correspondente.
   - Instalar ao menos um build em emulador e um aparelho físico por plataforma disponível.
   - Executar e manter os três roteiros Maestro: login, família cria vaga e profissional se candidata.
   - Acrescentar cenários mobile para sessão expirada/refresh, upload de documento, chat/anexo e transições de contrato conforme a API disponibilizada pela Sprint 2.
   - Validar notificações push em foreground, background e cold start, incluindo deep links por papel e ausência de navegação duplicada.
   - Registrar crashes no Sentry de homologação e confirmar que erro intencional de teste é recebido com ambiente/release corretos.

## Critérios de aceite

- [ ] `npx expo-doctor` não reporta dependências duplicadas nem incompatibilidades de SDK.
- [ ] Lint e typecheck do mobile passam em execução não interativa no CI.
- [ ] Há builds preview instaláveis de Android e iOS, associados ao mesmo commit e ambiente da API homologada.
- [ ] Nenhum build preview usa `localhost` como API base URL.
- [ ] Os três fluxos Maestro passam em ambiente controlado, com vídeo/log anexado.
- [ ] Login, refresh de sessão, criação de vaga, candidatura, chat, documento e notificações foram exercitados em app nativo conforme disponibilidade de plataforma.
- [ ] Sentry recebe eventos de homologação e não há crash bloqueante durante a rodada de QA.

## Gate de saída — Go/No-Go para homologação completa

Declarar **GO para QA E2E** somente quando todas as caixas das três sprints estiverem preenchidas, os relatórios web/mobile estiverem anexados e não houver bloqueador aberto de banco, autenticação, build nativo, integração ou fluxo crítico. Caso contrário, registrar **NO-GO**, o cenário afetado, evidência e a sprint de correção.

## Entregáveis finais para o QA

- URL e versão/commit do ambiente de homologação.
- Matriz de contas e dados de teste por papel.
- Resultado de migrations, health check e seed.
- Relatório Playwright da suíte autenticada.
- Links dos builds preview Android/iOS e versão instalada.
- Relatórios Maestro, evidências de push e painel Sentry de homologação.
- Lista de cenários aprovados, bloqueados e não aplicáveis, com responsável pela retestagem.
