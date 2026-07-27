# Cuidou — Runbook operacional de piloto

## Antes do deploy

1. Confirmar branch/release e executar `npm run predeploy`.
2. Conferir variáveis sem imprimir valores: `RELEASE_ENV=production npm run check:release`.
3. Aplicar migrations com `npm run prisma:migrate:deploy` e confirmar que não há migration failed.
4. Fazer deploy web e registrar commit/URL no ticket da release.
5. Para mobile, gerar preview EAS, validar login, marketplace, candidatura, chat, push e avaliação antes de promover produção.

## Smoke pós-deploy

- `HEALTHCHECK_URL=https://app.exemplo/api/health npm run check:release`
- Login de família, profissional e admin.
- Criar vaga, candidatar, aceitar, abrir conversa, concluir contrato e avaliar.
- Conferir `/admin` e `/api/admin/metrics` para leads, candidaturas e contratos.

## Incidente

1. Registrar horário, URL, commit, erro observado e impacto.
2. Verificar `/api/health`, logs estruturados por `requestId` e Sentry mobile.
3. Pausar novas comunicações/campanhas se o funil ou notificações estiverem inconsistentes.
4. Reverter para o deployment anterior seguindo [RELEASE_ROLLBACK_PLAN.md](RELEASE_ROLLBACK_PLAN.md).
5. Reexecutar smoke pós-deploy e documentar causa raiz e ação preventiva.

## Dados e privacidade

- Leads só são armazenados após consentimento explícito.
- Não registrar tokens, senhas, documentos ou conteúdo de conversa nos logs.
- Backup do PostgreSQL deve ser diário, criptografado e testado mensalmente por restauração.
- SLA inicial de suporte: resposta em até 1 dia útil; denúncias e risco de segurança são prioridade.
