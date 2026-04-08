# Estado Atual vs Release Checklist (2026-04-08)

Fonte base: `RELEASE_CHECKLIST.md`  
Metodo: leitura de codigo/docs + implementacao tecnica da Sprint 1 + execucao parcial de comandos de gate.

## Legenda

- `[x]` Atendido com evidencia no codigo/documentacao
- `[~]` Parcial ou nao validado nesta sessao
- `[ ]` Nao atendido / sem evidencia suficiente

## 1) Qualidade de Codigo

- `[ ]` `npm run lint` sem erros: **falhou** (12 erros + 5 warnings pre-existentes).
- `[ ]` `npm run typecheck` sem erros: **falhou** (erros TS pre-existentes em push-token/prisma/tests).
- `[ ]` `npm run test` passando: **falhou** (1 teste falho + 1 suite sem `DATABASE_URL`).
- `[ ]` `npm run test:e2e` passando: **falhou** (webServer nao sobe sem `DATABASE_URL`).
- `[~]` Zero `console.error` / `console.log` em producao: parcial (existem usos diretos em `server.ts`, `proxy.ts`, e boundaries).
- `[x]` Sem `TODO`/`FIXME` bloqueante em codigo critico: nao foram encontrados marcadores reais no scan.

## 2) Seguranca

- `[~]` `AUTH_SECRET` real em producao: depende de ambiente (nao validado em deploy alvo).
- `[x]` Rate limiting nos endpoints criticos: evidenciado em signup/messages/documents/reviews/reports.
- `[x]` Uploads validados (MIME/extensao/tamanho): evidenciado em `file-validation` e rotas de upload.
- `[x]` SSRF protection em fetch de media: evidenciado em `wordpress-media.ts`.
- `[~]` Sem secrets hardcoded: nao foi encontrado segredo obvio no codigo analisado, mas requer validacao de repositorio inteiro + historico.
- `[x]` `.env.exemple` atualizado com variaveis necessarias (`LOCAL_UPLOAD_DIR`, `HOST`, `PORT` incluidos).
- `[~]` `npm audit --audit-level=high`: nao executado nesta sessao.

## 3) Performance Web

- `[~]` Lighthouse >= 80: nao validado.
- `[~]` TTFB < 500ms: nao validado.
- `[~]` `next build` sem chunk > 250KB: nao validado.
- `[~]` Otimizacao de imagens e `remotePatterns`: nao validado nesta rodada.
- `[x]` `loading.tsx` em rotas pesadas (`/family`, `/professional`, `/admin`, `/marketplace`): presente.

## 4) Performance Mobile

- `[ ]` `FlatList` com `keyExtractor` e `initialNumToRender` em listas longas: sem evidencia completa; chat usa `keyExtractor`, mas `initialNumToRender` nao foi identificado.
- `[~]` Imagens com `expo-image` (cache): dependencia existe, uso completo nao foi comprovado em todas as telas.
- `[x]` Timeout de 10s no client mobile: `REQUEST_TIMEOUT_MS = 10_000`.
- `[x]` Smart retry React Query (sem retry em 4xx): implementado no provider de query.

## 5) Observabilidade

- `[~]` Logger estruturado substituiu `console.error` bruto: parcial.
- `[~]` `/api/health` retorna `db: "ok"` em producao: rota implementada, ambiente de producao nao validado.
- `[x]` Request logging ativo no middleware/proxy: evidenciado.
- `[x]` Error boundaries ativas:
  - web: `src/app/error.tsx` e `src/app/global-error.tsx`,
  - mobile: `ErrorBoundary` no root layout.
- `[x]` Sentry mobile integrado (MVP): bootstrap no root layout + captura no ErrorBoundary + tags basicas.

## 6) Retries e Timeouts

- `[x]` Timeout de 15s em chamadas externas: `fetch-with-timeout` default 15s.
- `[x]` Timeout de upload 30s para WordPress: configurado em upload de media.
- `[x]` Prisma pool com timeout de conexao e statement timeout: configurado em `prisma.ts`.
- `[~]` Retry `sendEmail` com backoff especifico "1s, 3s": ha retry/backoff exponencial, mas intervalo exato observado foi 1s e 2s.
- `[x]` Timeout de 10s no mobile API client: implementado.

## 7) Banco de Dados

- `[~]` `prisma migrate deploy` rodado: nao validado nesta sessao.
- `[~]` Sem migrations failed/pending: nao validado nesta sessao.
- `[~]` Seed executado quando necessario: nao validado nesta sessao.
- `[~]` Indices criticos presentes: nao auditado item a item nesta rodada.

## 8) Variaveis de Ambiente (Producao)

- `[~]` `AUTH_SECRET`: nao validado em ambiente alvo.
- `[~]` `DATABASE_URL`: nao validado em ambiente alvo.
- `[~]` `WORDPRESS_URL`: nao validado em ambiente alvo.
- `[~]` `WP_USER`: nao validado em ambiente alvo.
- `[~]` `WP_APP_PASS`: nao validado em ambiente alvo.
- `[~]` `NEXT_PUBLIC_WORDPRESS_API_HOSTNAME`: nao validado em ambiente alvo.
- `[~]` `RESEND_API_KEY`: nao validado em ambiente alvo.
- `[~]` `RESEND_FROM_EMAIL`: nao validado em ambiente alvo.
- `[~]` `NEXT_PUBLIC_APP_URL`: nao validado em ambiente alvo.
- `[~]` `AUTH_GOOGLE_ID`: nao validado em ambiente alvo.
- `[~]` `AUTH_GOOGLE_SECRET`: nao validado em ambiente alvo.

## 9) Mobile

- `[~]` Maestro flows passando: `maestro` indisponivel no ambiente atual (nao executado).
- `[ ]` Build de producao sem erros (`eas build`): dry-run falhou por erro de modulo no CLI (`@expo/eas-build-job`).
- `[x]` Crash reporting configurado (Sentry/equivalente): dependencia + init + captura implementados.
- `[x]` Versao/build incrementados em `app.json`: `ios.buildNumber` e `android.versionCode` adicionados.

## 10) Deploy

- `[ ]` `npm run predeploy` passou: **falhou** (interrompido no lint).
- `[ ]` `npm run check:health` respondeu ok: **falhou** (`ECONNREFUSED`, app local nao estava ativo).
- `[x]` Rollback plan definido: `RELEASE_ROLLBACK_PLAN.md`.
- `[~]` Monitoramento de erros ativo (Sentry/Analytics): Sentry MVP mobile implementado, validacao operacional pendente.
- `[ ]` Invalidação de CDN/cache definida (quando aplicavel): sem evidencia explicita.

## Conclusao objetiva

Status geral: **nao pronto para release imediato**.

Bloqueadores principais para virar "go/no-go positivo":
1. Corrigir falhas pre-existentes de lint/typecheck/test/e2e.
2. Disponibilizar Maestro e executar os 3 fluxos mobile.
3. Resolver erro de modulo do EAS CLI e repetir dry-run de build preview.
4. Revalidar predeploy + health check com ambiente local/producao correto.
