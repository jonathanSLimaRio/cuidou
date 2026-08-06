# Operação, SLOs e alertas

## SLO inicial (janela móvel de 30 dias)

- disponibilidade das jornadas autenticadas: 99,9%;
- respostas web/API sem 5xx: 99,5%;
- p95 da API: até 800 ms; readiness do banco: até 500 ms;
- login, upload, chat, e-mail e push sintéticos: 99% de sucesso;
- RPO do banco: 24 horas; RTO: 4 horas, até validação por exercício real.

## Alertas

- crítico: readiness indisponível por 5 minutos, 5xx acima de 5% por 10 minutos ou login abaixo de 95%;
- alto: p95 acima de 1,5 s por 15 minutos, upload/chat abaixo de 97% ou fila de e-mail/push com falhas persistentes;
- aviso: consumo de 50% e 75% do error budget, certificado/backup perto do vencimento.

Sentry recebe ambiente, release e request ID pelos cabeçalhos de aplicação. `sendDefaultPii` permanece desativado; conteúdo de chat, documentos, cookies, tokens e credenciais não deve ser anexado a eventos.
