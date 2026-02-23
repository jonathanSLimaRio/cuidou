# Cuidou

Marketplace (sem pagamentos) para conectar famílias, babás e cuidadoras de idosos.

## Stack

- Next.js 16 (App Router + TypeScript)
- Prisma ORM 7 + PostgreSQL
- Auth.js v5 (Google login)
- Vercel Blob (upload de documentos)
- Resend (emails transacionais)

## Funcionalidades implementadas

- Login social com Google.
- Onboarding com papel único por conta (`FAMILY`, `PROFESSIONAL`, `ADMIN`).
- Perfis de família e profissional.
- Upload e moderação documental do profissional.
- CRUD básico de vagas.
- Candidaturas com aprovação/rejeição/favoritos.
- Fluxo de aceite que libera contato e cria conversa 1:1.
- Chat interno com notificações in-app e email.
- Avaliações mútuas pós contratação.
- Denúncias e moderação administrativa.
- Convite de admins e trilha de auditoria.

## Endpoints principais

- `POST /api/onboarding/role`
- `GET|PUT /api/family/profile`
- `GET|PUT /api/professional/profile`
- `POST /api/professional/documents`
- `POST|GET /api/jobs`
- `GET|PUT /api/jobs/:id`
- `POST /api/jobs/:id/applications`
- `GET /api/family/jobs/:id/applications`
- `POST /api/applications/:id/accept`
- `POST /api/applications/:id/reject`
- `POST /api/applications/:id/favorite`
- `GET /api/conversations`
- `GET|POST /api/conversations/:id/messages`
- `POST /api/reviews`
- `POST /api/reports`
- `GET|PATCH /api/notifications`
- `GET /api/professionals`
- `GET /api/admin/moderation/*`
- `POST /api/admin/*`

## Setup local

1. Instale dependências:

```bash
npm install
```

2. Copie as variáveis:

```bash
cp .env.exemple .env
```

3. Gere o client Prisma:

```bash
npm run prisma:generate
```

4. Rode migrações (com banco configurado):

```bash
npm run prisma:migrate
```

5. Seed do admin inicial:

```bash
npm run prisma:seed
```

6. Rode o projeto:

```bash
npm run dev
```

## Variáveis de ambiente

Veja `.env.exemple` para lista completa.
