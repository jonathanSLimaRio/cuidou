# Auditoria integrada das cinco sprints

**Data:** 27/07/2026
**Escopo:** web, API, Expo, autenticação, marketplace, chat, notificações, uploads, métricas e release.

## Resultado executivo

As cinco sprints fecharam o núcleo funcional do marketplace: cadastro, aprovação, perfis, vagas, candidaturas, convites, contratação, chat, notificações, avaliações, moderação, métricas e captura de leads. A auditoria encontrou lacunas de integração e exposição pública que não apareciam nos testes sem autenticação real.

## Correções implementadas nesta auditoria

- Tokens Bearer mobile agora são aceitos em todas as rotas protegidas que o app consome (chat, conversas, notificações, onboarding, push, admin e demais endpoints).
- Bearer explícito tem prioridade sobre cookie web; um token inválido não pode herdar a sessão de outro usuário no mesmo domínio.
- Novas contas OAuth entram como `PENDING`, seguindo a mesma política do cadastro por senha. O default do Prisma foi alterado e o painel admin passou a listar pendentes OAuth.
- Convites de administrador são reivindicados atomicamente, evitando dupla aceitação concorrente.
- Marketplace público sempre filtra profissionais verificados e usuários ativos; a opção `verifiedOnly=false` deixou de expor perfis não verificados.
- Vagas públicas deixam de aparecer quando o responsável está suspenso/banido.
- Respostas públicas de profissionais passaram a usar `select` explícito, sem campos internos de verificação.
- Paginação e filtros de enum inválidos não causam mais `NaN`/erro 500; retornam 422 ou usam defaults seguros.
- Cadastro concorrente com o mesmo e-mail retorna 409 em vez de erro 500.
- Gate `npm run test:mobile` agora executa lint e typecheck do Expo.

## Evidências

| Verificação | Resultado |
|---|---:|
| `npm test` | 80 testes passando |
| `npm run test:e2e:api` | 48 testes passando em Chromium e Mobile Chrome |
| `npm run lint` | passou |
| `npm run typecheck` | passou |
| `npm run test:mobile` | passou (lint + typecheck) |
| `npm run prisma:validate` | passou |
| `npm run build` | passou |

## Pendências externas, não aplicadas automaticamente

- O banco configurado possui migrations pendentes, incluindo autenticação mobile, auditoria da Sprint 04, leads, eventos comerciais e default de aprovação OAuth. Aplicar somente no ambiente confirmado com `npm run prisma:migrate:deploy`.
- Executar `npm run check:release` contra homologação/produção com secrets reais.
- Validar EAS preview iOS/Android, Maestro em dispositivo/emulador, push real, Lighthouse e restauração de backup.
- Fazer jornada autenticada completa em homologação e definir piloto (cidade, categoria, liquidez e SLA comercial).
