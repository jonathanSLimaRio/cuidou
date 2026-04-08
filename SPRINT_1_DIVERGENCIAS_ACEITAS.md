# Sprint 1 - Divergencias Aceitas

Data: 2026-04-08

Estas divergencias foram aceitas para manter o foco em estabilidade e readiness sem expandir escopo.

## 1) Gates de qualidade com falhas pre-existentes

- Web gates foram executados (`lint`, `typecheck`, `test`, `test:e2e`, `predeploy`) e falharam em problemas pre-existentes.
- Consequencia: Sprint 1 nao fecha com status GO mesmo com os fixes de push/release readiness.
- Acao acordada: tratar esses erros como backlog bloqueante da decisao de release.

## 2) Smoke de push com dispositivo real

- Correcoes de roteamento e teste unitario foram implementados.
- Smoke manual completo (foreground/background/app fechado) depende de ambiente mobile rodando.
- Acao acordada: executar checklist de smoke no proximo ciclo de validacao operacional.

## 3) Dry-run de EAS build

- `eas.json`, versao/build e integracao Sentry MVP foram implementados.
- Dry-run de build foi tentado e falhou por erro de modulo do EAS CLI (`@expo/eas-build-job` ausente).
- Acao acordada: estabilizar o CLI e repetir `eas build --profile preview` antes de release.
