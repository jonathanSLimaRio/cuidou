# Sprint 2 - Evidencias de execucao

Data: 27/07/2026

## Escopo implementado

- Contrato `/api/mobile/auth/*` com login por email/senha, refresh, sessao, logout e Google condicionado a configuracao do provedor.
- Access token HS256 de curta duracao (15 minutos) e refresh token aleatorio, armazenado somente como SHA-256.
- Rotacao transacional de refresh token, revogacao no logout, expiracao em 30 dias e bloqueio de reutilizacao.
- Modelo Prisma `MobileRefreshToken` e migration `20260727130000_mobile_auth_sessions`.
- `requireUser` aceita Bearer mobile e consulta status/papel atuais no banco.
- Proxy permite Bearer em APIs protegidas sem abrir rotas para requisicoes anonimas.
- Expo usa Secure Store, hidratacao, sincronizacao, refresh automatico, logout local e mensagens de erro por codigo.
- Testes unitarios de assinatura/verificacao/hash, expiracao logica e autorizacao por papel, alem dos contratos E2E dos endpoints mobile.
- Roteiros Maestro atualizados para autenticar com contas seed locais, validar reabertura da sessao e usar seletores reais do app.

## Gates executados

| Comando | Resultado |
|---|---|
| `npm run prisma:validate` | PASS |
| `npm run prisma:generate` | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS - 69 testes |
| `npm run test:e2e` | PASS - 54 testes com 2 workers |
| `npm run test:mobile:lint` | PASS - 0 erros; 12 warnings existentes |
| `git diff --check` | PASS |

## Decisoes e pendencias operacionais

- O login Google so e ativado quando `AUTH_GOOGLE_ID` e os clientes Expo correspondentes estao configurados; tokens invalidos sao rejeitados.
- A migration precisa ser aplicada no ambiente alvo com `npm run prisma:migrate:deploy` antes de habilitar login real. Este workspace nao executa mutacoes no banco remoto automaticamente.
- A execucao Maestro ainda depende de build mobile, backend acessivel e seed aprovado. As contas locais usadas pelos fluxos sao documentadas em `CuidouApp/README.md`.
- A migracao do chat mobile para Ably permanece na Sprint 3.
