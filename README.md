# Cuidou

O comando `check:versions` registra Node, npm, Expo e a disponibilidade opcional do Maestro. O comando `check:health` consulta o Cuidou em `127.0.0.1:3000` por padrão e aceita `HEALTHCHECK_URL` para homologação/CI.

Marketplace para conectar famílias a babás e cuidadoras de idosos. A plataforma organiza descoberta, verificação, candidatura, contratação direta, conversa protegida e reputação. Não há intermediação de pagamento.

## Stack atual

| Camada | Tecnologia |
|---|---|
| Web/API | Next.js 16 App Router + TypeScript |
| Banco | PostgreSQL + Prisma 7 |
| Autenticação web | Auth.js v5: Google OAuth e e-mail/senha |
| Realtime | Ably Realtime; persistência das mensagens no PostgreSQL |
| Mídia | WordPress REST API |
| E-mail | Resend |
| UI | React 19 + Tailwind CSS v4 |
| Mobile | Expo SDK 54 + React Native + Expo Router |

## Funcionalidades do produto

- Cadastro local com aprovação administrativa e login Google no web.
- Onboarding com papel único: `FAMILY`, `PROFESSIONAL` ou `ADMIN`.
- Perfis de família/profissional, localização e disponibilidade semanal.
- Upload e moderação manual de documentos profissionais.
- CRUD de vagas com slots de agenda.
- Candidaturas, favoritos, aceite, rejeição e convites diretos.
- Contrato simples com início, conclusão e cancelamento.
- Chat protegido com mensagens, respostas rápidas, anexos e bloqueio.
- Avaliações mútuas após contrato concluído.
- Denúncias de usuários, vagas, mensagens e conversas.
- Notificações in-app, e-mail e push Expo quando o ambiente estiver configurado.
- Painel admin com moderação, convites, métricas e auditoria.
- Marketplace público de vagas e profissionais verificados.

## Setup local

Requisitos: Node.js 20+, npm 10+ e PostgreSQL.

```bash
npm install
Copy-Item .env.exemple .env.local
# Preencha pelo menos AUTH_SECRET e DATABASE_URL em .env.local
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Em homologacao/producao, aplique migrations versionadas com `npm run prisma:migrate:deploy` (nao use `prisma migrate dev`). O comando deve rodar no ambiente que possui a `DATABASE_URL` alvo antes de habilitar o login mobile.

O servidor local fica em `http://localhost:3000`. O chat web usa Ably; não existe servidor WebSocket próprio nem rota `/ws` neste projeto.

## Variáveis de ambiente

Obrigatórias para produção:

```text
AUTH_SECRET
DATABASE_URL
NEXT_PUBLIC_APP_URL
ABLY_API_KEY
NEXT_PUBLIC_WORDPRESS_API_HOSTNAME
```

Para habilitar integrações:

```text
AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET
MOBILE_GOOGLE_CLIENT_IDS
WORDPRESS_URL / WP_USER / WP_APP_PASS
RESEND_API_KEY / RESEND_FROM_EMAIL
```

O app mobile possui configuração própria em `CuidouApp/app.json` e variáveis `EXPO_PUBLIC_*`, incluindo API base, Google, Sentry, ambiente e release. Consulte [CuidouApp/README.md](CuidouApp/README.md).

## Mídia e uploads

Novos documentos profissionais e anexos de chat são enviados para WordPress por REST API e precisam de `WORDPRESS_URL`, `WP_USER` e `WP_APP_PASS`. O código ainda consegue ler referências legadas `local-upload:` do diretório `LOCAL_UPLOAD_DIR`, mas isso não é um fallback de escrita para novos uploads.

## Comandos de validação

```bash
npm run check:versions   # Node, npm, Expo e disponibilidade do Maestro
npm run lint             # lint web
npm run typecheck        # TypeScript web
npm test                 # testes unitários
npm run test:web         # lint + typecheck + unitários
npm run test:e2e:api     # contratos de API
npm run test:e2e:smoke   # páginas e smoke web
npm run test:e2e         # todos os E2E em servidor isolado na porta 3100
npm run test:mobile:lint      # lint Expo
npm run test:mobile:typecheck # typecheck Expo
npm run test:mobile            # gate mobile (lint + typecheck)
npm run check:health     # health do Cuidou; use HEALTHCHECK_URL ou PLAYWRIGHT_PORT
npm run check:release    # preflight: variáveis obrigatórias + health check sem expor secrets
npm run build            # build de produção web
```

O Playwright inicia uma instância própria do Cuidou em `127.0.0.1:3100`. Para testar um ambiente externo, informe explicitamente `PLAYWRIGHT_BASE_URL`; nesse caso o Playwright não inicia servidor local.

## Smoke manual mínimo

1. Criar conta local como família ou profissional.
2. Aprovar a conta no painel admin.
3. Completar perfil e disponibilidade.
4. Família publica uma vaga; profissional candidata-se ou recebe convite.
5. Família aceita; contrato e conversa são criados.
6. Enviar mensagem/anexo, concluir contrato e registrar avaliações.
7. Verificar notificações, auditoria e moderação.

O seed de desenvolvimento cria contas locais e vagas de demonstração. Nunca use essas credenciais em produção.

Contas padrão do seed:

| Papel | E-mail | Senha |
|---|---|---|
| Admin | `admin.local@cuidou.dev` | `Cuidou123!` |
| Família | `familia.local@cuidou.dev` | `Cuidou123!` |
| Profissional | `cuidadora.local@cuidou.dev` | `Cuidou123!` |

Essas contas existem apenas para desenvolvimento e validação local; altere ou remova-as antes de qualquer ambiente compartilhado.

## Aplicativo mobile

Na Sprint 3, o chat mobile usa o mesmo Ably Realtime do web, com `tokenRequest`, reconexao gerenciada pelo SDK e mensagens persistidas antes da publicacao. Push e health check tambem reportam o estado das integracoes sem expor segredos.

O repositório inclui `CuidouApp`, que consome a API web. Os fluxos Maestro estão em:

- `CuidouApp/maestro/login-flow.yaml`
- `CuidouApp/maestro/family-create-job.yaml`
- `CuidouApp/maestro/professional-apply.yaml`

Antes de liberar o mobile, valide os fluxos de autenticação/sessão implementados na Sprint 2 e o chat Ably da Sprint 3. A interface mobile ainda depende da migração do realtime descrita em [sprint_lacuna.md](sprint_lacuna.md).

## Documentação de entrega

- [spec.md](spec.md): contrato técnico e fluxos do produto.
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md): gate de release.
- [sprint_lacuna.md](sprint_lacuna.md): plano de fechamento das lacunas.
- [SPRINT_2_EVIDENCIAS_EXECUCAO.md](SPRINT_2_EVIDENCIAS_EXECUCAO.md): evidências da implementação de autenticação mobile.
- [comercial.md](comercial.md): estratégia comercial e Business Model Canvas.
