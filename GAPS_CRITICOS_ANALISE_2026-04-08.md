# Gaps Criticos - Analise

Data: 2026-04-08  
Escopo: analise sem alteracao de codigo-fonte.

## Resumo executivo

O backend/web esta funcionalmente maduro para os fluxos centrais do marketplace.
Os maiores riscos atuais estao em:
- roteamento de push no mobile (impacto direto em navegacao do usuario),
- documentacao desatualizada (impacto em onboarding de time e release),
- readiness de release sem validacao executada ponta-a-ponta.

## Gap 1 - Push routing mobile (Criticidade: Alta)

## Evidencia

Arquivo: `CuidouApp/src/providers/notifications-provider.tsx`

- `APPLICATION_RECEIVED` direciona para `/(family)/applications`.
- `INVITATION_STATUS_UPDATED` direciona sempre para `/(professional)/invitations`.

Por outro lado, as rotas existentes da familia sao:
- `CuidouApp/app/(family)/pipeline.tsx`
- `CuidouApp/app/(family)/invitations.tsx`

## Risco

- usuario clica no push e cai em rota inexistente/errada,
- perda de conversao em fluxo de candidatura/convite,
- aumento de tickets de suporte por "push nao abre lugar certo".

## Acao recomendada (quando liberar codigo)

1. Ajustar mapeamento de `APPLICATION_RECEIVED` para a rota real da familia.
2. Tornar `INVITATION_STATUS_UPDATED` condicionado ao papel autenticado.
3. Adicionar teste de unidade para `resolveNavigationTarget`.
4. Validar com teste manual de push em:
   - conta familia,
   - conta profissional.

## Gap 2 - Documentacao mobile desatualizada (Criticidade: Alta)

## Evidencia

Arquivo antigo: `CuidouApp/README.md` estava no template default do Expo.

## Impacto

- onboarding tecnico fica impreciso,
- setup de QA perde tempo,
- risco de operacao com premissas antigas.

## Acao executada nesta entrega

- README mobile reescrito para refletir stack, rotas, automacao e estado atual.

## Gap 3 - Drift de documentacao de ambiente (Criticidade: Media)

## Evidencia

`spec.md` lista variaveis como `LOCAL_UPLOAD_DIR`, `HOST`, `PORT`, enquanto
`.env.exemple` nao explicita essas chaves.

## Impacto

- ambientes diferentes por interpretacao de cada dev,
- diagnostico de comportamento inconsistente entre maquinas.

## Acao recomendada

1. Alinhar `.env.exemple` com todas as variaveis de `spec.md`.
2. Marcar obrigatorio/opcional com fallback documentado.
3. Registrar defaults efetivos usados em runtime.

## Gap 4 - Cobertura de validacao ainda limitada (Criticidade: Media)

## Evidencia

- Web E2E atual: foco em smoke e contratos basicos.
- Mobile: fluxos Maestro existem, mas sem evidencias de execucao recente.
- Testes mobile unitarios/integracao: nao encontrados no momento da analise.

## Impacto

- regressao pode passar despercebida em fluxo real,
- release sem confianca operacional.

## Acao recomendada

1. Rodar bateria minima antes de qualquer release:
   - web: `lint`, `typecheck`, `test`, `test:e2e`,
   - mobile: 3 fluxos Maestro.
2. Abrir suite de testes unitarios para funcoes criticas mobile (routing de push).

## Gap 5 - Release readiness mobile (Criticidade: Media/Alta)

## Evidencia

- sem `eas.json` versionado,
- `app.json` sem incremento de build metadata (`buildNumber`/`versionCode`),
- crash reporting nao identificado na analise atual.

## Impacto

- dificuldade de empacotar build reproduzivel,
- risco de falta de rastreabilidade em incidentes.

## Acao recomendada

1. Definir pipeline oficial de build (EAS ou equivalente).
2. Versionar politica de versao/build.
3. Integrar crash reporting com runbook minimo.

## Prioridade sugerida (ordem)

1. Corrigir push routing mobile.
2. Fechar checklist de release com evidencia.
3. Executar bateria minima de testes.
4. Fechar readiness mobile (build/version/crash reporting).
