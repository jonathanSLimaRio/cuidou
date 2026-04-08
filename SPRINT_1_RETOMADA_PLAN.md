# Plano de Retomada - Sprint 1

Data de referencia: 2026-04-08  
Escopo: retomada rapida com foco em estabilidade e prontidao de release.

## Objetivo da sprint

Fechar gaps criticos de produto e release sem expandir escopo funcional.

## Resultado esperado ao fim da sprint

- mobile sem bug critico de roteamento de push,
- documentacao principal alinhada com estado real,
- checklist de release com status objetivo e evidencias,
- pacote pronto para sprint seguinte de hardening final/deploy.

## Ordem exata de execucao

## Fase 0 - Baseline (Dia 1, bloco 1)

1. Congelar baseline de branch `develop`.
2. Validar ambientes (web + mobile) e credenciais de dev.
3. Confirmar stack de execucao local (Node/npm/Expo/Maestro).
4. Registrar snapshot inicial:
   - hash do commit,
   - versoes de runtime,
   - status de testes atual.

## Fase 1 - Alinhamento de documentacao (Dia 1, bloco 2)

1. Atualizar `CuidouApp/README.md` (feito nesta entrega).
2. Garantir consistencia entre:
   - `README.md` (raiz),
   - `spec.md`,
   - `.env.exemple`,
   - `RELEASE_CHECKLIST.md`.
3. Publicar nota de divergencias aceitas para a sprint.

## Fase 2 - Correcao de gap critico mobile (Dia 2)

1. Corrigir roteamento de push no provider mobile:
   - `APPLICATION_RECEIVED` -> rota existente da familia.
   - `INVITATION_STATUS_UPDATED` -> roteamento por papel.
2. Fazer smoke manual de notificacao recebida e clique no push.
3. Registrar resultado em checklist de validacao funcional.

## Fase 3 - Cobertura minima de regressao (Dia 3)

1. Web:
   - rodar `lint`, `typecheck`, `test`, `test:e2e`.
2. Mobile:
   - rodar os 3 fluxos Maestro existentes.
3. Tratar falhas bloqueantes de fluxo principal:
   - login,
   - onboarding,
   - criar vaga,
   - candidatar,
   - chat.

## Fase 4 - Readiness de release (Dia 4)

1. Atualizar checklist "estado atual vs release" com status real.
2. Fechar pendencias de observabilidade e release mobile:
   - estrategia de crash reporting,
   - versao/build number mobile,
   - plano de rollback.
3. Rodar dry-run de predeploy.

## Fase 5 - Gate de saida (Dia 5)

1. Revalidar itens criticos do checklist.
2. Definir decisao:
   - pronto para release,
   - ou carry-over explicito para sprint 2.
3. Publicar relatorio final da sprint.

## Criterios de aceite da sprint

- Sem bug critico aberto em login, onboarding, convite, candidatura e chat.
- Push mobile levando para tela correta no clique.
- Documentacao principal sem drift evidente.
- Checklist de release preenchido com evidencias (nao apenas opiniao).

## Itens fora do escopo desta sprint

- Novas features de produto.
- Refactors amplos de UI/arquitetura.
- Otimizacoes profundas de performance sem impacto em release imediato.
