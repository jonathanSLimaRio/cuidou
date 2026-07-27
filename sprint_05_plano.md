# Sprint 05 — Release, segurança operacional e preparação comercial

## Entregas implementadas

- Lista de espera real na landing page, com consentimento, validação, deduplicação e rate limit.
- Endpoint `POST /api/leads` e persistência em `WaitlistLead`.
- Eventos de produto (`ProductEvent`) para lead, cadastro, login, perfil ativado, vaga publicada, candidatura, aceite, avaliação, denúncia e contrato concluído.
- Painel admin com eventos comerciais além do funil operacional.
- Tela administrativa de leads para follow-up do piloto, com endpoint paginado protegido por papel.
- Health check com latência do banco, ambiente e versão/commit.
- `npm run check:release` para validar variáveis obrigatórias e health check sem expor secrets.
- Runbook de deploy, smoke test, incidente, rollback, suporte, SLA e backup.
- Filtros e auditoria de Sprint 04 preservados; release continua bloqueada se migrations ou smoke falharem.

## Critérios de aceite

- [x] Landing captura lead com consentimento e resposta acessível.
- [x] Lead duplicado não cria registro duplicado.
- [x] Eventos de funil são persistidos sem bloquear a jornada principal.
- [x] Admin visualiza leads e conversões na janela selecionada.
- [x] Health check expõe DB, integrações, latência e versão sem dados sensíveis.
- [x] Existe comando reproduzível de preflight de release.
- [x] Runbook define deploy, smoke, rollback, suporte e backup.

## Gates externos

- Rodar migrations `20260727160000_sprint5_waitlist_leads` e `20260727161000_sprint5_product_events` no ambiente alvo.
- Executar `npm run check:release` contra homologação/produção.
- Rodar Lighthouse, EAS preview iOS/Android e Maestro em dispositivo/emulador.
- Configurar backups e validar restauração com o provedor PostgreSQL.
- Definir cidade/categoria do piloto pago e acompanhar a liquidez antes de expandir.
