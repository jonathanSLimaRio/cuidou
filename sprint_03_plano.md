# Sprint 03 - Chat, push e integracoes externas

## Objetivo

Entregar chat realtime consistente entre web e Expo, notificacoes acionaveis e diagnostico seguro das dependencias externas.

## Backlog executado

1. **Realtime Ably**
   - Migrar o cliente mobile de WebSocket manual para `ably`/`Realtime`.
   - Consumir `tokenRequest` com capacidade limitada ao canal privado da conversa.
   - Manter PostgreSQL como fonte de verdade e publicar no Ably somente depois do commit.
   - Evitar retry duplicado quando a publicacao realtime falhar.

2. **Push e navegacao**
   - Corrigir `APPLICATION_STATUS_UPDATED` da familia para o pipeline.
   - Validar tokens Expo no backend e adicionar timeout ao envio.
   - Reprocessar falhas transitorias de push com backoff limitado.
   - Manter deduplicacao de taps em foreground, background e cold start.

3. **Integracoes e arquivos**
   - Expor saude de Ably, WordPress, Resend e Expo Push sem vazar valores.
   - Proteger downloads locais contra path traversal.

4. **QA e release**
   - Adicionar contratos E2E para health e token realtime.
   - Testar capacidade Ably, retry de push e todos os destinos de notificacao.
   - Atualizar checklist Maestro, README, especificacao e evidencias.

## Criterios de aceite

- Mobile nao abre `/ws` e recebe eventos do mesmo canal Ably usado pelo web.
- Mensagem persistida permanece enviada mesmo se Ably estiver temporariamente indisponivel.
- Familia recebe atualizacao de candidatura no pipeline.
- Health retorna `degraded` em producao quando uma integracao obrigatoria nao estiver configurada.
- Download de anexo continua restrito aos participantes e nao permite escapar do diretorio local.

## Gates externos

- Configurar secrets e credenciais de Ably, WordPress, Resend e EAS por ambiente.
- Executar um teste cruzado web + dispositivo Expo fisico com conversa real.
- Validar push em dispositivo fisico; simuladores nao sao evidencia de entrega Expo.
