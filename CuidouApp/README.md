# CuidouApp (Mobile)

Aplicativo mobile (Expo + React Native) do ecossistema Cuidou.

Este app consome a API do projeto web em `../` e cobre os fluxos de:
- autenticacao (email/senha e Google),
- onboarding por papel,
- dashboard de familia,
- dashboard de profissional,
- modulos de admin,
- chat em tempo real com anexos,
- notificacoes push (registro de token e deep link interno).

## Stack

- Expo SDK 54
- React Native 0.81
- Expo Router (roteamento por arquivos)
- TanStack Query
- Expo Notifications
- Expo Document Picker
- Expo Secure Store
- Sentry (erro e crash reporting)

## Estrutura de rotas

- `app/(public)` login, signup, termos, privacidade
- `app/(marketplace)` marketplace publico
- `app/(protected)` onboarding, notificacoes e chat
- `app/(family)` area da familia
- `app/(professional)` area da profissional
- `app/(admin)` area de administracao

## Pre-requisitos

- Node.js 20+
- npm 10+
- API web rodando (projeto raiz) em `http://localhost:3000` ou URL configurada
- Expo CLI (via `npx expo ...`)

## Configuracao

As configuracoes de runtime ficam em `app.json` e em variaveis `EXPO_PUBLIC_*`.

Campos principais:
- `EXPO_PUBLIC_API_BASE_URL` (ou `expo.extra.apiBaseUrl`)
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID` (opcional)
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (opcional)
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` (opcional)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (opcional)
- `EXPO_PUBLIC_SENTRY_DSN` (opcional, recomendado para release)
- `EXPO_PUBLIC_APP_ENV` (opcional, default: `development`)
- `EXPO_PUBLIC_APP_RELEASE` (opcional, default: `slug@version`)

Se os IDs do Google nao estiverem configurados, login Google fica desabilitado no app (com fallback para email/senha).

## Rodando localmente

```bash
npm install
npx expo start
```

Atalhos:

```bash
npm run android
npm run ios
npm run web
```

## Automacao mobile (Maestro)

Fluxos existentes:
- `maestro/login-flow.yaml`
- `maestro/family-create-job.yaml`
- `maestro/professional-apply.yaml`

Execucao:

```bash
maestro test maestro/login-flow.yaml
maestro test maestro/family-create-job.yaml
maestro test maestro/professional-apply.yaml
```

Os tres fluxos fazem login por email/senha e usam as contas locais criadas pelo seed:

| Fluxo | Conta |
| --- | --- |
| login | `familia.local@cuidou.dev` |
| family-create-job | `familia.local@cuidou.dev` |
| professional-apply | `cuidadora.local@cuidou.dev` |

Senha local dos tres fluxos: `Cuidou123!`. Essas credenciais sao somente para desenvolvimento; nao as reutilize em ambientes compartilhados.

## Estado atual e pontos de atencao (Sprint 4)

- README atualizado para refletir o app real (antes estava no template padrao Expo).
- Roteamento de push corrigido:
  - `APPLICATION_RECEIVED` agora navega para `/(family)/pipeline`.
  - `INVITATION_STATUS_UPDATED` agora roteia por papel (`FAMILY`/`PROFESSIONAL`).
  - cold start depende de auth hidratada e usa deduplicacao para evitar navegacao duplicada.
- Pipeline de release mobile fechado:
  - `eas.json` versionado com perfis `preview` e `production`.
  - `ios.buildNumber` e `android.versionCode` definidos em `app.json`.
- Crash reporting MVP ativo:
  - bootstrap do Sentry no root layout.
  - captura no `ErrorBoundary`.
  - tags basicas de ambiente/release/user.
- Chat mobile alinhado ao Ably: nao ha mais conexao direta com `/ws`; o cliente usa `tokenRequest`, reconexao do SDK e indicador de conexao.
- Push registra tokens Expo e direciona notificacoes de candidatura, convite, contrato, documento e chat para as rotas correspondentes.

## Relacao com o backend

Este app depende das rotas do projeto web em `../src/app/api`.
Antes de validar fluxos mobile, garantir que o backend esteja com:
- banco migrado com `npm run prisma:migrate:deploy`,
- seed executado (quando necessario),
- auth configurada,
- endpoint de health disponivel.

## Contrato de integracao atual

O backend web e a fonte de verdade da API. Configure `EXPO_PUBLIC_API_BASE_URL` explicitamente para o ambiente que sera validado.

O login mobile usa as rotas `/api/mobile/auth/login`, `/refresh`, `/session`, `/logout` e `/google`, com access token curto, refresh token rotativo persistido e armazenamento no Secure Store. O backend web também aceita o Bearer token mobile nas APIs protegidas.

O chat web e mobile usam Ably Realtime. Os fluxos Maestro continuam sendo roteiros de validação e não representam, por si só, um release mobile aprovado: ainda dependem de banco migrado, seed, credenciais locais e um emulador/dispositivo com Maestro instalado.
