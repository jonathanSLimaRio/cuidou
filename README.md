# Cuidou

Marketplace para conectar famílias a babás e cuidadoras de idosos. Sem intermediação de pagamento — a plataforma conecta, verifica e facilita a contratação direta.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router + TypeScript) |
| ORM / Banco | Prisma 7 + PostgreSQL |
| Autenticação | Auth.js v5 — Google OAuth + email/senha |
| Chat em tempo real | WebSocket (`ws`) via custom server Node.js |
| Armazenamento de mídia | WordPress REST API (documentos e anexos) |
| Email transacional | Resend |
| UI | Tailwind CSS v4 + Lucide icons |

## Funcionalidades

- Login social (Google) e local (email + senha com aprovação por admin)
- Onboarding com papel único e imutável por conta (`FAMILY`, `PROFESSIONAL`, `ADMIN`)
- Perfis de família e profissional com localização e disponibilidade semanal
- Upload e moderação documental do profissional (identidade, antecedentes, certificações)
- CRUD completo de vagas com slots de agenda
- Candidaturas com pipeline de triagem (favoritos, aceite, rejeição, retirada)
- Convites diretos de família para profissional com expiração automática
- Fluxo de aceite que cria contrato e desbloqueia chat 1:1
- Chat em tempo real via WebSocket com anexos (imagens e PDFs)
- Avaliações mútuas pós-contrato
- Denúncias de usuários, vagas, mensagens e conversas
- Notificações in-app e por email em todos os eventos relevantes
- Painel admin com moderação, convites de admin e trilha de auditoria
- Marketplace público de vagas e profissionais verificados

## Setup local

### 1. Dependências

```bash
npm install
```

### 2. Variáveis de ambiente

```bash
cp .env.exemple .env.local
# Edite .env.local com seus valores
```

Variáveis obrigatórias para subir localmente:

```
AUTH_SECRET=         # openssl rand -base64 32
DATABASE_URL=        # postgresql://user:pass@localhost:5432/cuidou_dev
```

Variáveis opcionais (funcionalidades degradam graciosamente se ausentes):

```
AUTH_GOOGLE_ID=      # OAuth Google — sem isso, apenas login local disponível
AUTH_GOOGLE_SECRET=
WORDPRESS_URL=       # Armazenamento de mídia — sem isso, uploads salvos em ./uploads/
WP_USER=
WP_APP_PASS=
RESEND_API_KEY=      # Email transacional — sem isso, emails apenas logados
RESEND_FROM_EMAIL=
LOCAL_UPLOAD_DIR=    # Diretório local de uploads (padrão: ./uploads)
```

### 3. Banco de dados

```bash
npm run prisma:generate   # gera o Prisma Client
npm run prisma:migrate    # executa migrações
npm run prisma:seed       # cria contas de teste e dados iniciais
```

### 4. Rodar o projeto

```bash
npm run dev
```

O servidor inicia em `http://localhost:3000`.
O WebSocket fica disponível em `ws://localhost:3000/ws`.

## Scripts disponíveis

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (Next.js + WebSocket) |
| `npm run build` | Build de produção |
| `npm run start` | Inicia em modo produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sem emitir arquivos |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run prisma:migrate` | Migrações de banco |
| `npm run prisma:seed` | Seed de desenvolvimento |
| `npm run migrate:blob-to-wordpress` | Migração de arquivos legados para WordPress |
| `npm run design:media` | Gera e sobe imagens de design no WordPress |

## Contas de desenvolvimento

Criadas pelo `npm run prisma:seed`:

| Papel | Email | Senha |
|-------|-------|-------|
| Admin | `admin.local@cuidou.dev` | `Cuidou123!` |
| Família | `familia.local@cuidou.dev` | `Cuidou123!` |
| Profissional | `cuidadora.local@cuidou.dev` | `Cuidou123!` |

O seed também cria 2 vagas abertas da família local para testar o fluxo de candidatura cruzada.

> **Aviso:** Remova ou rotacione essas credenciais antes de qualquer ambiente não-dev.

## Variáveis de ambiente completas

Veja `.env.exemple` para a lista completa com descrições.

## Armazenamento de mídia

Quando `WORDPRESS_URL`, `WP_USER` e `WP_APP_PASS` estão configurados, documentos e anexos de chat são enviados à API REST do WordPress.

Quando não configurados, os arquivos são salvos localmente em `./uploads/` (ou no caminho em `LOCAL_UPLOAD_DIR`). Adequado para desenvolvimento local — sem configuração extra necessária.

## WebSocket

O chat usa WebSocket para entrega de mensagens em tempo real. O servidor WS roda no mesmo processo que o Next.js via `server.ts`, na rota `/ws`.

Autenticação: token HMAC-SHA256 de 60 s emitido em `GET /api/ws-token`, usado apenas no handshake. A conexão persiste após estabelecida. O cliente reconecta com backoff exponencial (1 s → 30 s) em caso de queda.

## Migração de mídia legada

Se houver registros antigos em Blob:

```bash
npm run migrate:blob-to-wordpress -- --dry-run  # simulação
npm run migrate:blob-to-wordpress               # execução
```

## Geração de mídia de design

Para gerar novas imagens e subir no WordPress com o prefixo `cuidou-v2-design`:

```bash
npm run design:media

# Apenas algumas chaves
npm run design:media -- --only=homeHero,loginHero

# Usa arquivos já existentes sem gerar novamente
npm run design:media -- --skip-generate
```
