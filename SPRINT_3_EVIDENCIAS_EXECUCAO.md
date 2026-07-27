# Sprint 3 - Evidencias de execucao

Data: 27/07/2026

## Objetivo

Unificar chat web/mobile em Ably, tornar push acionavel e explicitar a saude das integracoes externas.

## Implementado

- Cliente Expo migrado de WebSocket manual para `ably`/`Realtime`.
- Repositorio mobile consome `tokenRequest` de `/api/ws-token`; nao existe mais expectativa de `/ws?token=...`.
- Reconexao e renovacao de token ficam sob responsabilidade do SDK Ably; o mobile exibe `Ao vivo`, `Reconectando...`, `Conectando...` ou `Offline`.
- Mensagem continua sendo persistida no PostgreSQL antes da publicacao no canal privado; falha transitoria do Ably nao provoca retry duplicado no cliente.
- Rota de notificacao `APPLICATION_STATUS_UPDATED` da familia aponta para o pipeline.
- Todos os tipos de push declarados possuem destino ou fallback para a central de notificacoes; rotas sensiveis respeitam o papel autenticado.
- Health check exibe apenas booleans de integracoes e nomes de configuracoes ausentes, sem valores de secrets.
- Push Expo usa timeout, filtro de token valido e continua best-effort.
- Push Expo tenta novamente falhas transitorias (429/5xx/rede) com backoff limitado.
- Download de upload legado local bloqueia path traversal; anexos seguem limitados por MIME, quantidade, tamanho e participantes da conversa.
- Checklist Maestro e contrato E2E cobrem o endpoint de realtime e o roteamento de notificacoes.

## Gates executados

| Comando | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm test` | PASS - 75 testes |
| `npm run lint` | PASS |
| `npm --prefix CuidouApp run lint` | PASS - 0 erros; 11 avisos existentes |
| `npm --prefix CuidouApp exec tsc -- --noEmit` | PASS |
| `npm run prisma:validate` | PASS |
| `npm run test:e2e -- e2e/api-contracts.spec.ts e2e/mobile-auth-contracts.spec.ts --project=chromium` | PASS - 20 testes |
| `git diff --check` | PASS |

## Pendencias operacionais

- Configurar `ABLY_API_KEY`, WordPress, Resend e projeto EAS em cada ambiente.
- Executar validacao cruzada em dois dispositivos/builds (web + Expo) com uma conversa criada apos aceite de candidatura.
- Validar entrega real de push em dispositivo fisico; simuladores nao recebem push Expo.
