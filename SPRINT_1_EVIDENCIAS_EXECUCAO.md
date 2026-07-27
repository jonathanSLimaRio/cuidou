# Sprint 1 - Matriz de Evidencias de Execucao

## Execucao atualizada — 27/07/2026

Esta rodada implementa o objetivo da Sprint 01 de tornar o baseline web/API/mobile
reprodutível e a documentação coerente com a arquitetura vigente.

### Entregas

- Playwright isolado em `127.0.0.1:3100`, com `PLAYWRIGHT_BASE_URL` para ambientes externos e sem reutilização acidental de servidor.
- Contratos E2E apontando para a mesma base configurada pelo Playwright.
- Comandos separados para web, API, smoke E2E, versões e lint mobile.
- `.env.exemple` tornado versionável (`.gitignore` deixa o arquivo de exemplo fora da regra de exclusão) e ampliado com variáveis Expo/Sentry/release.
- `check:versions` agora registra Node, npm, Expo e a ausência opcional do Maestro; `check:health` aceita `HEALTHCHECK_URL` e `PLAYWRIGHT_PORT`.
- Contratos de API validados também com `PLAYWRIGHT_PORT=3201`, sem voltar a usar a porta de outro projeto.
- README, `spec.md`, `.env.exemple` e README mobile alinhados a Ably Realtime, WordPress e aos contratos atuais.
- Smoke E2E ajustado para validar a semântica real dos formulários e aguardar o carregamento determinístico do marketplace.

### Gates executados

| Comando | Resultado |
|---|---|
| `npm run check:versions` | PASS — Node `v22.22.2`, npm `10.9.7`, Expo `54.0.23`; Maestro ausente (opcional) |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 65 testes |
| `npm run test:e2e:api` | PASS — 30 testes |
| `PLAYWRIGHT_PORT=3201 npm run test:e2e:api -- --project=chromium` | PASS — 15 testes |
| `npm run test:e2e:smoke` | PASS — 16 testes (Chromium + mobile-chrome) |
| `npm run test:e2e` | PASS — 46 testes (Chromium + mobile-chrome) |
| `npm run test:mobile:lint` | PASS — 0 erros; 12 warnings existentes |
| `git diff --check` | PASS |

### Pendências mantidas para as próximas sprints

- Endpoints de autenticação mobile e integração de sessão permanecem no escopo da Sprint 02.
- Migração do chat mobile do WebSocket manual para o contrato Ably permanece no escopo da Sprint 03.
- Testes E2E autenticados de ponta a ponta e execução Maestro em dispositivo permanecem como expansão posterior.

Data base: 2026-04-08  
Responsavel: Codex (implementacao), Time Cuidou (validacao operacional)

## Legenda

- `PASS`: comprovado nesta sessao
- `FAIL`: executado e falhou com evidencia
- `BLOCKED`: nao executado por bloqueio de ambiente
- `PENDING`: depende de execucao posterior planejada

## Evidencias tecnicas implementadas

| Item | Evidencia | Status | Responsavel |
|---|---|---|---|
| Push routing mobile corrigido | `CuidouApp/src/navigation/notification-routing.ts` + provider atualizado | PASS | Codex |
| Cobertura unitaria de roteamento | `src/lib/__tests__/notification-routing-mobile.test.ts` | PASS (arquivo criado) | Codex |
| Cold start com auth hidratada + dedupe | `CuidouApp/src/providers/notifications-provider.tsx` | PASS | Codex |
| EAS pipeline versionado | `CuidouApp/eas.json` | PASS | Codex |
| Versionamento mobile | `CuidouApp/app.json` (`ios.buildNumber`, `android.versionCode`) | PASS | Codex |
| Sentry MVP mobile | `CuidouApp/src/lib/sentry.ts`, `app/_layout.tsx`, `error-boundary.tsx`, `auth-provider.tsx` | PASS | Codex |
| Drift de env docs fechado | `.env.exemple` + `README.md` | PASS | Codex |

## Evidencias de comandos de regressao/release

| Comando | Resultado | Status | Responsavel |
|---|---|---|---|
| `node -v && npm -v && npx -v` | Node `v22.22.2`, npm/npx `10.9.7` | PASS | Codex |
| `npx vitest run src/lib/__tests__/notification-routing-mobile.test.ts` | 8/8 testes passando | PASS | Codex |
| `npm run lint` (raiz) | 12 erros + 5 warnings pre-existentes (React hooks/eslint config) | FAIL | Codex |
| `npm run typecheck` (raiz) | falhas TS pre-existentes (`pushToken`, globals de test, `DATABASE_URL` dependencias) | FAIL | Codex |
| `npm run test` (raiz) | suite falhou por 1 assert + 1 suite sem `DATABASE_URL` | FAIL | Codex |
| `npm run test:e2e` (raiz) | webServer nao sobe sem `DATABASE_URL` | FAIL | Codex |
| `npm run predeploy` (raiz) | interrompido no lint (mesmos erros) | FAIL | Codex |
| `npm run check:health` (raiz) | `ECONNREFUSED` (app local nao estava em execucao) | FAIL | Codex |
| `npm run lint` (CuidouApp) | sem erros reportados | PASS | Codex |
| `npx tsc --noEmit` (CuidouApp) | falha pre-existente em `push-notifications.ts` (`projectId`) | FAIL | Codex |
| `maestro test CuidouApp/maestro/login-flow.yaml` | `maestro` nao encontrado no PATH | BLOCKED | Time Cuidou |
| `maestro test CuidouApp/maestro/family-create-job.yaml` | `maestro` nao encontrado no PATH | BLOCKED | Time Cuidou |
| `maestro test CuidouApp/maestro/professional-apply.yaml` | `maestro` nao encontrado no PATH | BLOCKED | Time Cuidou |
| `npm exec eas-cli -- --version` | `eas-cli/18.5.0` disponivel | PASS | Codex |
| `npm exec eas-cli -- build --platform android --profile preview --non-interactive --no-wait` | falha de CLI (`MODULE_NOT_FOUND` em `@expo/eas-build-job`) | FAIL | Codex |

## Proximo gate operacional

1. Corrigir falhas pre-existentes de lint/typecheck/test na raiz.
2. Disponibilizar Maestro no ambiente para executar os 3 fluxos mobile.
3. Resolver falha de modulo do EAS CLI e repetir dry-run de build preview.
4. Reexecutar `predeploy` + health check com app local em execucao.
