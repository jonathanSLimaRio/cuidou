# Cuidou

Marketplace (sem pagamentos) para conectar famílias, babás e cuidadoras de idosos.

## Stack

- Next.js 16 (App Router + TypeScript)
- Prisma ORM 7 + PostgreSQL
- Auth.js v5 (Google + email/senha)
- WordPress REST API (upload de documentos e anexos)
- Resend (emails transacionais)

## Funcionalidades implementadas

- Login social com Google e login local por email/senha.
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

## Credenciais locais de desenvolvimento (temporário)

As contas abaixo são criadas/atualizadas por `npm run prisma:seed` para testes em ambiente dev:

- Admin: `admin.local@cuidou.dev`
- Família: `familia.local@cuidou.dev`
- Cuidadora: `cuidadora.local@cuidou.dev`
- Senha (todas): `Cuidou123!`
- O seed local também cria 2 vagas abertas da família local para teste cruzado do fluxo de candidatura.

Aviso: remova ou rotacione essas credenciais antes de qualquer uso fora de desenvolvimento.

## Variáveis de ambiente

Veja `.env.exemple` para lista completa.

## Migração legado (Blob -> WordPress)

Se houver registros antigos no Blob, rode:

```bash
npm run migrate:blob-to-wordpress -- --dry-run
npm run migrate:blob-to-wordpress
```

## Geração de mídia IA (design) + upload WordPress

Para gerar novas imagens de design e subir no WordPress com prefixo `cuidou-v2-design`:

```bash
npm run design:media
```

Opções úteis:

```bash
# gera/sube apenas algumas chaves
npm run design:media -- --only=homeHero,loginHero

# usa arquivos já existentes em output/imagegen/cuidou-v2
npm run design:media -- --skip-generate
```
