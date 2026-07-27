# Sprint 04 — Fechamento dos fluxos de marketplace

## Objetivo

Concluir as transições críticas do marketplace e deixar o ciclo candidatura → contrato → avaliação observável, reversível apenas por regras explícitas e sem depender de intervenção técnica.

## Plano executado

1. **Transições e segurança de estado**
   - Criar retirada de candidatura para profissionais enquanto o status é `SUBMITTED` ou `SHORTLISTED`.
   - Tornar repetição de retirada, rejeição e conclusão/cancelamento de contrato segura (idempotente).
   - Impedir aceite de candidatura em vaga que não esteja `OPEN`.
   - Registrar retirada em auditoria e notificar a família.

2. **Marketplace confiável**
   - Garantir que o detalhe público de profissional não exponha perfis não verificados.
   - Manter filtros/listagens com `VerificationStatus.VERIFIED` como padrão.

3. **Experiência web/mobile**
   - Adicionar confirmação e estado de processamento para retirada no painel web.
   - Adicionar confirmação, loading e atualização da lista no aplicativo mobile.
   - Preservar estados vazios e filtros existentes, incluindo `WITHDRAWN`.

4. **Operação e métricas**
   - Expor funil no endpoint e painel admin: cadastros ativos (proxy de aprovação), perfis completos, vagas publicadas, candidaturas, aceites e contratos.
   - Cobrir endpoint de retirada no contrato E2E sem autenticação.

5. **Revisão complementar da sprint**
   - Tornar aceite, recusa e cancelamento de convites idempotentes, inclusive em corridas concorrentes.
   - Auditar mudanças de convite (`INVITATION_STATUS_UPDATED`) e expirações disparadas por qualquer participante.
   - Evitar notificação/auditoria duplicada quando admin reaplica o mesmo status de usuário ou vaga.

## Resultado e critérios de aceite

- [x] Profissional consegue retirar candidatura antes da decisão da família.
- [x] Retirada gera `APPLICATION_WITHDRAWN`, notificação e `withdrawnAt`.
- [x] Aceite não cria contrato/conversa em vaga pausada, fechada ou arquivada.
- [x] Repetições de estados terminais não duplicam efeitos colaterais.
- [x] Perfis não verificados não aparecem no detalhe público.
- [x] Funil é exibido no painel e retornado por `/api/admin/metrics`.
- [x] Web, API e mobile passam typecheck/lint/testes automatizados.
- [x] API E2E: 40 testes passam em Chromium e Mobile Chrome.
- [x] Convites terminais podem ser repetidos sem duplicar candidatura, notificação ou auditoria.
- [x] Status administrativo idêntico é tratado como operação sem efeito colateral.

## Gates operacionais pendentes

- Aplicar as migrations `20260727140000_sprint4_application_withdrawal` e `20260727150000_sprint4_invitation_audit` no ambiente compartilhado (`prisma migrate deploy`).
- Executar uma jornada autenticada com dados de homologação e o roteiro Maestro em dispositivo/emulador; os testes locais desta sprint cobrem contrato HTTP e não criam usuários reais.
- O teste autenticado automatizado está disponível em `e2e/sprint4-authenticated.spec.ts` e é habilitado com `RUN_AUTH_E2E=1`, `AUTH_E2E_EMAIL` e `AUTH_E2E_PASSWORD`.
- Confirmar com operação o SLA de revisão e o significado comercial de “cadastro aprovado”; o funil usa usuários `ACTIVE` como proxy até existir `approvedAt`.
