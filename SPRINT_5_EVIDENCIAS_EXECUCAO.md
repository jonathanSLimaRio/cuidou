# Evidências de execução — Sprint 05

## Implementado

- `WaitlistLead` + migration `20260727160000_sprint5_waitlist_leads`.
- `POST /api/leads` público, validado, deduplicado e limitado a 5 tentativas/hora por IP.
- Formulário acessível de lista de espera na landing page.
- `ProductEvent` + migration `20260727161000_sprint5_product_events`.
- Eventos: lead capturado, cadastro, login, perfil ativado, vaga publicada, candidatura, aceite, avaliação, denúncia e contrato concluído.
- Painel admin com contadores comerciais na janela selecionada.
- Lista administrativa de leads para follow-up comercial, sem exposição pública dos contatos.
- Health check com versão, ambiente e latência de banco.
- `npm run check:release` e [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md).

## Gates executados

| Verificação | Resultado |
|---|---:|
| `npm test` | 77 testes passando |
| `npm run test:e2e:api` | 44 testes passando em Chromium e Mobile Chrome |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npx prisma validate` | passou |
| `npm run build` | passou |
| `npx tsc --noEmit` em `CuidouApp` | passou |
| `npm --prefix CuidouApp run lint` | passou sem erros ou avisos |
| `npm run check:versions` | passou; Maestro indisponível no ambiente |

## Gates externos ainda necessários

- `npx prisma migrate status` identificou 8 migrations pendentes no banco configurado (incluindo as duas da Sprint 05 e a política OAuth); aplicar com `npm run prisma:migrate:deploy` somente após confirmar o ambiente alvo.
- Executar `HEALTHCHECK_URL=... npm run check:release` contra o ambiente alvo.
- Rodar Lighthouse, EAS preview iOS/Android e Maestro em dispositivo/emulador.
- Configurar backup/restauração no provedor PostgreSQL e definir cidade/categoria do piloto.

## Auditoria integrada posterior

As cinco sprints foram reauditadas em `AUDITORIA_GERAL_5_SPRINTS.md`. A rodada corrigiu o suporte Bearer nas rotas protegidas, exposição de perfis não verificados/inativos, concorrência de convite admin, paginação/filtros inválidos e o gate mobile lint + typecheck.
