# Cuidou — Release Checklist

Use this checklist before every production deploy. Every item must be ✅ before releasing.

---

## 1. Qualidade de Código

- [ ] `npm run lint` — zero erros e warnings
- [ ] `npm run typecheck` — zero erros TypeScript
- [ ] `npm run test` — todos os testes unitários e de contrato passando
- [ ] `npm run test:e2e` — todos os fluxos críticos E2E passando
- [ ] Zero `console.error` / `console.log` no código de produção (use `logger`)
- [ ] Nenhum `TODO` ou `FIXME` bloqueante em código crítico

---

## 2. Segurança

- [ ] **AUTH_SECRET** configurada como variável de ambiente real (não dev fallback)
  - Gerar com: `openssl rand -base64 32`
- [ ] **Rate limiting** ativo nos endpoints críticos:
  - `POST /api/auth/signup` — 5/hora
  - `POST /api/conversations/[id]/messages` — 30/5min
  - `POST /api/professional/documents` — 5/hora
  - `POST /api/reviews` — 3/hora
  - `POST /api/reports` — 5/hora
- [ ] **Uploads validados** (MIME type + extensão + tamanho) em todos os endpoints de upload
- [ ] **SSRF protection** ativa em `fetchWordPressMediaBinary`
- [ ] Nenhum secret/token hardcoded no código-fonte
- [ ] `.env.exemple` atualizado com todas as variáveis necessárias
- [ ] Dependências sem vulnerabilidades conhecidas: `npm audit --audit-level=high`

---

## 3. Performance Web

- [ ] Lighthouse score ≥ 80 em Performance, Accessibility e Best Practices
  - Testar em: `/` (landing), `/marketplace/professionals`, `/family`
- [ ] TTFB < 500ms na página principal
- [ ] `next build` — nenhum chunk JS > 250KB (gzip)
- [ ] Imagens otimizadas com `next/image` e `remotePatterns` corretos
- [ ] `loading.tsx` presente nas rotas pesadas: `/family`, `/professional`, `/admin`, `/marketplace`

---

## 4. Performance Mobile

- [ ] `FlatList` com `keyExtractor` e `initialNumToRender` em todas as listas longas
- [ ] Nenhuma imagem carregada sem `expo-image` (com cache)
- [ ] Timeout de 10s configurado no API client mobile
- [ ] Smart retry ativo no React Query (sem retry em 4xx)

---

## 5. Observabilidade

- [ ] Logger estruturado (`src/lib/logger.ts`) substituiu todos os `console.error` brutos
- [ ] `GET /api/health` retornando 200 com `db: "ok"` no ambiente de produção
- [ ] Request logging ativo no middleware (method, path, status, duration)
- [ ] Error boundaries ativas:
  - Web: `src/app/error.tsx` + `src/app/global-error.tsx`
  - Mobile: `ErrorBoundary` envolvendo o root layout

---

## 6. Retries e Timeouts

- [ ] Timeout de 15s em todas as chamadas externas (WordPress, Resend)
- [ ] Timeout de upload de 30s para uploads WordPress
- [ ] Pool Prisma com `connectionTimeoutMillis: 5000` e `statement_timeout: 10s`
- [ ] Retry com backoff exponencial em `sendEmail` (2x: 1s, 3s)
- [ ] Timeout de 10s no mobile API client

---

## 7. Banco de Dados

- [ ] Todas as migrations pendentes rodadas: `prisma migrate deploy`
- [ ] Nenhuma migration em estado `failed` ou `pending`
- [ ] Seed de dados iniciais rodado (se necessário): `npm run prisma:seed`
- [ ] Índices críticos presentes (verificar no Prisma schema)

---

## 8. Variáveis de Ambiente (Produção)

| Variável | Obrigatória | Verificado |
|---|---|---|
| `AUTH_SECRET` | ✅ Sim | [ ] |
| `DATABASE_URL` | ✅ Sim | [ ] |
| `WORDPRESS_URL` | ✅ Sim | [ ] |
| `WP_USER` | ✅ Sim | [ ] |
| `WP_APP_PASS` | ✅ Sim | [ ] |
| `NEXT_PUBLIC_WORDPRESS_API_HOSTNAME` | ✅ Sim | [ ] |
| `RESEND_API_KEY` | ⚠️ Recomendado | [ ] |
| `RESEND_FROM_EMAIL` | ⚠️ Recomendado | [ ] |
| `NEXT_PUBLIC_APP_URL` | ✅ Sim | [ ] |
| `AUTH_GOOGLE_ID` | ⚠️ Se usar OAuth | [ ] |
| `AUTH_GOOGLE_SECRET` | ⚠️ Se usar OAuth | [ ] |

---

## 9. Mobile

- [ ] Maestro E2E flows passando:
  - `maestro test CuidouApp/maestro/login-flow.yaml`
  - `maestro test CuidouApp/maestro/family-create-job.yaml`
  - `maestro test CuidouApp/maestro/professional-apply.yaml`
- [ ] Build de produção gerado sem erros: `expo build` ou `eas build`
- [ ] Crash reporting configurado (Sentry ou equivalente)
- [ ] Versão do app (version + buildNumber) incrementada no `app.json`

---

## 10. Deploy

- [ ] `npm run predeploy` passou sem erros (lint + typecheck + test + build)
- [ ] Health check respondendo: `npm run check:health`
- [ ] Rollback plan definido caso o deploy falhe
- [ ] Monitoramento de erros ativo (Sentry / Vercel Analytics)
- [ ] CDN/cache invalidado para assets estáticos (se aplicável)

---

## Comando de Verificação Rápida

```bash
# Rode este bloco antes de qualquer deploy
npm run predeploy && npm run check:health
```

Se algum comando falhar, **não faça o deploy** até resolver.
