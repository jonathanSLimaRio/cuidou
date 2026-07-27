# Cuidou — Especificações Técnicas

## 1. Visão geral

Cuidou é um marketplace bilateral de cuidado doméstico. Conecta **famílias** que precisam de babás ou cuidadoras de idosos a **profissionais** disponíveis na mesma região. Não há intermediação de pagamento — a plataforma facilita descoberta, verificação e contratação; o pagamento ocorre diretamente entre as partes.

---

## 2. Arquitetura

> **Estado atual (Sprint 3 — 27/07/2026):** web e mobile usam Ably Realtime. Referências históricas a `server.ts`, `ws` e `EventEmitter` devem ser lidas como legado; o contrato vigente é o fluxo Ably descrito abaixo.

### Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                        Cliente (browser)                     │
│  Next.js App Router  ·  React 19  ·  Tailwind CSS v4        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / Ably Realtime
┌──────────────────────────────▼──────────────────────────────┐
│                    Next.js + Ably Realtime                       │
│  ┌─────────────────────────┐  ┌────────────────────────┐    │
│  │     Next.js (HTTP)      │  │  Ably Realtime │    │
│  │  API Routes (App Router)│  │  Ably — realtime   │    │
│  │  Server Components      │  │  real por conversa     │    │
│  └────────────┬────────────┘  └───────────┬────────────┘    │
│               │                           │                  │
│               └──────────┬────────────────┘                  │
│                          │ Ably channels         │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       Serviços externos                      │
│  PostgreSQL (Prisma 7)  ·  WordPress REST API (mídia)       │
│  Resend (email)  ·  Google OAuth                            │
└─────────────────────────────────────────────────────────────┘
```

### Decisões de arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Renderização | Server Components + Client Components | Dados sensíveis server-side; interatividade client-side |
| Realtime | Ably Realtime (`ably`) | Pub/sub gerenciado, autorização por canal e suporte web/mobile |
| Auth Realtime | Token request Ably de curta duração | Permissão limitada ao canal da conversa |
| Upload de mídia | WordPress REST API | Armazenamento externo com CDN; referências locais legadas são somente leitura |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Tipo-seguro, migrations versionadas |
| Email | Resend | Falha silenciosa quando não configurado (graceful degradation) |

---

## 3. Modelos de dados

### Entidades principais

```
User
 ├── FamilyProfile         (1:1)
 ├── ProfessionalProfile   (1:1)
 │    ├── ProfessionalDocument[]
 │    ├── ProfessionalAvailabilitySlot[]
 │    └── ProfessionalAvailabilityException[]
 ├── JobPost[]             (criadas pela família)
 ├── JobApplication[]      (enviadas pelo profissional)
 ├── JobInvitation[]       (enviadas pela família, recebidas pelo profissional)
 ├── Conversation[]        (como família ou profissional)
 ├── Contract[]            (como família ou profissional)
 ├── Review[]              (dadas ou recebidas)
 ├── Notification[]
 ├── Report[]
 └── AuditLog[]            (apenas admins)

JobPost
 ├── JobApplication[]
 ├── JobInvitation[]
 ├── JobScheduleSlot[]
 ├── Contract[]
 └── Conversation[]

JobApplication
 ├── Contract              (1:1, criado no aceite)
 ├── Conversation          (1:1, criada no aceite)
 └── Review[]

Conversation
 └── Message[]
      └── MessageAttachment[]
```

### Enums

| Enum | Valores |
|------|---------|
| `UserRole` | `FAMILY`, `PROFESSIONAL`, `ADMIN` |
| `UserStatus` | `PENDING`, `ACTIVE`, `SUSPENDED`, `BANNED` |
| `ServiceType` | `BABYSITTER`, `ELDER_CAREGIVER` |
| `VerificationStatus` | `NOT_SUBMITTED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED` |
| `JobStatus` | `OPEN`, `PAUSED`, `CLOSED`, `ARCHIVED` |
| `ApplicationStatus` | `SUBMITTED`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`, `WITHDRAWN` |
| `ContractStatus` | `IN_PROGRESS`, `COMPLETED`, `CANCELED` |
| `JobInvitationStatus` | `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`, `CANCELED` |
| `MessageKind` | `TEXT`, `QUICK_REPLY`, `TEXT_WITH_ATTACHMENTS` |
| `DocumentType` | `IDENTITY`, `BACKGROUND_CHECK`, `CERTIFICATION`, `OTHER` |
| `ReportStatus` | `OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED` |
| `ReportTargetType` | `USER`, `JOB`, `MESSAGE`, `PROFESSIONAL_PROFILE`, `CONVERSATION` |
| `NotificationType` | `APPLICATION_RECEIVED`, `APPLICATION_STATUS_UPDATED`, `INVITATION_RECEIVED`, `INVITATION_STATUS_UPDATED`, `CHAT_MESSAGE`, `CONTRACT_STATUS_UPDATED`, `DOCUMENT_STATUS_UPDATED`, `REPORT_STATUS_UPDATED`, `SYSTEM` |
| `Weekday` | `MONDAY` … `SUNDAY` |
| `Shift` | `MORNING`, `AFTERNOON`, `EVENING`, `OVERNIGHT` |
| `AuditAction` | `DOCUMENT_APPROVED`, `DOCUMENT_REJECTED`, `REPORT_RESOLVED`, `REPORT_DISMISSED`, `JOB_STATUS_UPDATED`, `USER_STATUS_UPDATED`, `ADMIN_INVITE_CREATED`, `CONTRACT_COMPLETED`, `CONTRACT_CANCELED` |

---

## 4. API — Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/signup` | Cria conta local (status `PENDING`) |
| `*` | `/api/auth/[...nextauth]` | Auth.js — login, callback, logout |

### Autenticação mobile

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/mobile/auth/login` | Login email/senha; retorna access token de 15 minutos e refresh token rotativo |
| `POST` | `/api/mobile/auth/google` | Troca um ID token Google validado por sessão mobile quando o provedor está configurado |
| `POST` | `/api/mobile/auth/refresh` | Revoga o refresh token usado e emite um par novo |
| `GET` | `/api/mobile/auth/session` | Retorna o usuário do Bearer token mobile vigente |
| `POST` | `/api/mobile/auth/logout` | Revoga o refresh token atual; operação idempotente |

### Onboarding

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/onboarding/role` | Define papel (`FAMILY` ou `PROFESSIONAL`) e cria perfil |

### Família

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET\|PUT` | `/api/family/profile` | Lê ou atualiza perfil da família |
| `GET` | `/api/family/applications` | Lista candidaturas recebidas nas vagas da família |
| `GET` | `/api/family/invitations` | Lista convites enviados pela família |
| `GET` | `/api/family/jobs/:id/applications` | Candidaturas de uma vaga específica |
| `POST` | `/api/family/jobs/:id/invitations` | Envia convite direto a um profissional |

### Profissional

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET\|PUT` | `/api/professional/profile` | Lê ou atualiza perfil profissional |
| `GET\|POST` | `/api/professional/documents` | Lista ou envia documentos (rate limit: 5/h) |
| `GET\|PUT` | `/api/professional/availability` | Lê ou atualiza slots de disponibilidade e exceções |
| `GET` | `/api/professional/applications` | Lista candidaturas enviadas |
| `GET` | `/api/professional/invitations` | Lista convites recebidos |

### Vagas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET\|POST` | `/api/jobs` | Lista vagas abertas ou cria nova vaga |
| `GET\|PUT\|DELETE` | `/api/jobs/:id` | Lê, edita ou remove vaga |
| `POST` | `/api/jobs/:id/applications` | Profissional se candidata à vaga |
| `GET` | `/api/jobs/:id/invitations` | Lista convites de uma vaga |

### Candidaturas

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/applications/:id/accept` | Aceita candidatura → cria contrato + conversa |
| `POST` | `/api/applications/:id/reject` | Rejeita candidatura |
| `POST` | `/api/applications/:id/favorite` | Marca/desmarca candidatura como favorita |

### Convites

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/invitations/:id/accept` | Profissional aceita convite |
| `POST` | `/api/invitations/:id/decline` | Profissional recusa convite |
| `POST` | `/api/invitations/:id/cancel` | Família cancela convite |

### Chat

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/conversations` | Lista conversas do usuário com contagem de não lidas |
| `GET\|POST` | `/api/conversations/:id/messages` | Lista mensagens (cursor-based) ou envia nova (rate limit: 30/5min) |
| `PATCH` | `/api/conversations/:id/block` | Bloqueia ou desbloqueia conversa |
| `GET` | `/api/messages/attachments/:id/download` | Download protegido de anexo |
| `GET` | `/api/ws-token` | Emite `tokenRequest` Ably para o canal da conversa |
| `GET` | `/api/chat/quick-replies` | Lista respostas rápidas por papel |

### Contratos

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/contracts` | Lista contratos do usuário |
| `POST` | `/api/contracts/:id/complete` | Marca contrato como concluído |
| `POST` | `/api/contracts/:id/cancel` | Cancela contrato com motivo |

### Avaliações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET\|POST` | `/api/reviews` | Lista ou cria avaliação pós-contrato (rate limit: 3/h) |
| `GET` | `/api/reviews/aggregate` | Média e contagem de avaliações por usuário |

### Denúncias

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/reports` | Cria denúncia (rate limit: 5/h) |

### Notificações

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET\|PATCH` | `/api/notifications` | Lista notificações ou marca todas como lidas |
| `PATCH` | `/api/notifications/:id/read` | Marca notificação individual como lida |

### Marketplace público

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/professionals` | Lista profissionais verificados com filtros |
| `GET` | `/api/professionals/:id` | Detalhe de profissional verificado |

### Admin

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET\|POST` | `/api/admin/invites` | Lista ou cria convite de admin |
| `POST` | `/api/admin/invites/accept` | Aceita convite de admin |
| `POST` | `/api/admin/invites/:id/revoke` | Revoga convite pendente |
| `GET` | `/api/admin/moderation/documents` | Documentos aguardando revisão |
| `GET` | `/api/admin/moderation/reports` | Denúncias abertas |
| `GET` | `/api/admin/moderation/users` | Usuários com status `PENDING` |
| `GET` | `/api/admin/moderation/jobs` | Vagas para moderação |
| `POST` | `/api/admin/documents/:id/review` | Aprova ou rejeita documento |
| `POST` | `/api/admin/reports/:id/resolve` | Resolve ou descarta denúncia |
| `POST` | `/api/admin/users/:id/status` | Atualiza status do usuário |
| `POST` | `/api/admin/jobs/:id/status` | Atualiza status de vaga |
| `GET` | `/api/admin/metrics` | KPIs da plataforma (janelas de 7, 30, 90 dias) |
| `GET` | `/api/admin/audit-logs` | Trilha de auditoria paginada |

### Sistema

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Health check |

---

## 5. Páginas (App Router)

### Públicas (sem autenticação)

| Rota | Descrição |
|------|-----------|
| `/` | Homepage com hero, serviços, depoimentos e métricas |
| `/marketplace` | Índice do marketplace com contagens ao vivo |
| `/marketplace/jobs` | Lista de vagas abertas com filtros |
| `/marketplace/jobs/:id` | Detalhe de vaga com botão de candidatura |
| `/marketplace/professionals` | Lista de profissionais verificados com filtros |
| `/marketplace/professionals/:id` | Perfil público do profissional com botão de convite |
| `/login` | Login (Google OAuth + email/senha) |
| `/signup` | Cadastro local |
| `/privacy` | Política de privacidade (LGPD) |
| `/terms` | Termos de uso |

### Autenticadas

| Rota | Papel | Descrição |
|------|-------|-----------|
| `/onboarding` | Qualquer | Seleção de papel pós-cadastro |
| `/dashboard` | Qualquer | Redirect para painel do papel correto |
| `/family` | FAMILY | Dashboard completo da família |
| `/professional` | PROFESSIONAL | Dashboard completo do profissional |
| `/admin` | ADMIN | Painel de moderação e métricas |
| `/admin/invite/accept` | ADMIN | Aceite de convite de admin via token |
| `/chat` | FAMILY, PROFESSIONAL, ADMIN | Lista de conversas |
| `/chat/:id` | FAMILY, PROFESSIONAL, ADMIN | Sala de chat em tempo real |
| `/notifications` | Qualquer | Central de notificações |

---

## 6. Autenticação e autorização

### Provedores

- **Google OAuth** — acesso imediato após callback; cria conta com status `ACTIVE`
- **Email/senha** — hash bcrypt; conta criada com status `PENDING`, requer aprovação de admin

### Sessão mobile

- O app Expo usa access token assinado com `AUTH_SECRET`, expiração de 15 minutos e claims mínimos (`sub`, papel e status).
- Refresh tokens são valores aleatórios, armazenados somente como SHA-256 no modelo `MobileRefreshToken`, expiram em 30 dias e são rotacionados a cada uso.
- Logout revoga o refresh token; reutilização de token rotacionado retorna erro e não cria uma nova sessão.
- As APIs protegidas aceitam o Bearer token mobile e consultam o status/papel atuais no banco, evitando confiar em claims antigas.

### Proteção de rotas

- Middleware (`auth.config.ts`) bloqueia `/dashboard`, `/family`, `/professional`, `/admin`, `/chat`, `/notifications` para não autenticados
- `requireUser(roles?, request?)` em toda API — valida sessão + papel + status
- Usuários `SUSPENDED` e `BANNED` são bloqueados no callback de autenticação

### Realtime com Ably

- Cliente solicita `GET /api/ws-token?conversationId=...` e recebe `tokenRequest` Ably.
- Cliente conecta ao Ably e assina somente `private:conversation:{conversationId}`.
- O backend valida papel e acesso à conversa antes de emitir a permissão do canal.
- A mensagem é persistida no PostgreSQL e publicada no Ably somente após a persistência.
- Admins podem receber token para qualquer conversa conforme a regra de suporte do backend.

---

## 7. Chat em tempo real (Ably)

### Fluxo de uma mensagem

```
Remetente
  │  POST /api/conversations/:id/messages
  │  → salva no PostgreSQL
  │  → publish `new_message` no canal Ably
  │                          │
  │              Ably channel
  │              → channel = private:conversation:{conversationId}
  │              → channel.publish("new_message", message)
  │                          │
  └─────────────────────────▼
                        Destinatário (browser)
                        → mergeMessages(current, [message])
                        → re-render instantâneo
```

### Reconexão no cliente

```
onclose → scheduleReconnect()
  delay = min(delay * 2, 30_000)  // backoff exponencial: 1s → 2s → 4s → ... → 30s
  cliente Ably reconecta com backoff
    → GET /api/ws-token  (novo token)
    → cliente Ably assina o canal
  onopen → delay = 1_000  (reseta)
```

### Canais

```typescript
channel: private:conversation:{conversationId}
```

A assinatura Ably é autorizada por conversa; o cliente recebe apenas a capacidade do canal correspondente e o SDK gerencia reconexão.

---

## 8. Armazenamento de mídia

### WordPress (produção)

Quando `WORDPRESS_URL`, `WP_USER`, `WP_APP_PASS` configurados:
- Upload via `POST /wp-json/wp/v2/media` com Basic Auth
- Proteção SSRF: validação de hostname contra `WORDPRESS_URL`
- Timeout: 30 s por upload
- `sourceUrl` armazenado no banco; `pathname = "wp-media:{id}"`

### Referências locais legadas

O código consegue ler referências antigas `local-upload:` usando `LOCAL_UPLOAD_DIR` e não tenta removê-las via WordPress. Novos documentos e anexos são enviados pelo caminho WordPress; não há fallback local de escrita ativo.

### Tipos aceitos

| Contexto | MIME aceitos | Extensões | Tamanho máximo |
|----------|-------------|-----------|---------------|
| Documentos | `image/jpeg`, `image/png`, `application/pdf` | `.jpg`, `.jpeg`, `.png`, `.pdf` | 5 MB |
| Anexos de chat | `image/*`, `application/pdf` | qualquer | 10 MB |

---

## 9. Rate limiting

| Endpoint | Limite |
|----------|--------|
| Upload de documentos | 5 por hora por IP |
| Envio de mensagens | 30 por 5 minutos por IP |
| Criação de denúncias | 5 por hora por IP |
| Criação de avaliações | 3 por hora por IP |

Implementação: in-memory com `Map<key, { count, resetAt }>`. Resposta `429` com headers `Retry-After` e `X-RateLimit-*`.

---

## 10. Notificações

### In-app

Todas as ações relevantes criam registros `Notification` no banco. O sino de notificações na navbar conta as não lidas.

### Email (Resend)

Disparado nos mesmos eventos. Se `RESEND_API_KEY` não estiver configurado, log de aviso e continua sem email (falha silenciosa).

### Tabela de eventos

| Evento | Notificado | Tipo |
|--------|-----------|------|
| Nova candidatura | Família | `APPLICATION_RECEIVED` |
| Candidatura aceita/rejeitada/retirada | Profissional ou Família | `APPLICATION_STATUS_UPDATED` |
| Convite recebido | Profissional | `INVITATION_RECEIVED` |
| Convite aceito/recusado/expirado | Família | `INVITATION_STATUS_UPDATED` |
| Nova mensagem no chat | Destinatário | `CHAT_MESSAGE` |
| Contrato criado/concluído/cancelado | Ambas as partes | `CONTRACT_STATUS_UPDATED` |
| Documento revisado | Profissional | `DOCUMENT_STATUS_UPDATED` |
| Denúncia resolvida | Denunciante | `REPORT_STATUS_UPDATED` |
| Nova denúncia (triagem) | Admin | `REPORT_STATUS_UPDATED` |

---

## 11. Auditoria

Ações administrativas críticas geram registros `AuditLog`:

| Ação | Trigger |
|------|---------|
| `DOCUMENT_APPROVED` / `DOCUMENT_REJECTED` | Revisão de documento |
| `REPORT_RESOLVED` / `REPORT_DISMISSED` | Resolução de denúncia |
| `JOB_STATUS_UPDATED` | Moderação de vaga |
| `USER_STATUS_UPDATED` | Alteração de status de usuário |
| `ADMIN_INVITE_CREATED` | Criação de convite de admin |
| `CONTRACT_COMPLETED` / `CONTRACT_CANCELED` | Finalização de contrato |

---

## 12. Fluxos dos usuários

### 12.1 Família

#### Cadastro e acesso

```
/signup (email + senha) → status PENDING → admin aprova → ACTIVE
  OU
/login → Google OAuth → status ACTIVE imediato
  ↓
/onboarding → seleciona FAMILY → cria FamilyProfile
  ↓
/family (dashboard)
```

#### Publicar e gerir vaga

```
/family → JobForm → POST /api/jobs
  ↓
Vaga criada com status OPEN e isVisible: true
  ↓
Editar → PUT /api/jobs/:id  (título, descrição, localização, faixa de valor, agenda)
Pausar / reabrir → PUT /api/jobs/:id { status: "PAUSED" | "OPEN" }
Excluir → DELETE /api/jobs/:id  (bloqueado se houver contrato ativo)
```

#### Receber e triar candidaturas

```
ApplicationsPipeline (dashboard)
  ├── Ver candidaturas por status (SUBMITTED, SHORTLISTED, ACCEPTED, REJECTED)
  ├── Favoritar → POST /api/applications/:id/favorite
  ├── Aceitar → POST /api/applications/:id/accept
  │     ├── Cria Contract (IN_PROGRESS)
  │     ├── Cria Conversation (chat desbloqueado)
  │     ├── Pausa vaga (PAUSED — sem novas candidaturas)
  │     └── Notifica profissional
  └── Rejeitar → POST /api/applications/:id/reject
        └── Notifica profissional
```

#### Convidar profissional diretamente

```
/marketplace/professionals/:id → InviteToJobForm
  ↓
POST /api/family/jobs/:id/invitations { professionalId, message? }
  ↓
Convite com status PENDING, expira em 7 dias
  ↓
Profissional aceita → cria JobApplication automaticamente
```

#### Gerenciar contrato e avaliação

```
ContractsPanel → ver contratos IN_PROGRESS e COMPLETED
  ├── Concluir → POST /api/contracts/:id/complete
  └── Cancelar → POST /api/contracts/:id/cancel { reason }
        ↓
     Contrato COMPLETED → ReviewForm disponível
        ↓
     POST /api/reviews { applicationId, rating, comment? }
```

---

### 12.2 Profissional

#### Cadastro e verificação

```
/signup ou Google OAuth → /onboarding → seleciona PROFESSIONAL
  ↓
/professional (dashboard)
  ↓
Completar perfil → PUT /api/professional/profile
  { bio, experienceYears, serviceTypes, state, city, hourlyRateMin, hourlyRateMax }
  ↓
Upload de documentos → POST /api/professional/documents
  { documentType: IDENTITY | BACKGROUND_CHECK | CERTIFICATION | OTHER, file }
  ↓
Status: UNDER_REVIEW → Admin revisa → VERIFIED | REJECTED
  ↓ (VERIFIED)
Perfil visível no marketplace público
```

#### Configurar disponibilidade

```
AvailabilityManager → PUT /api/professional/availability
  {
    slots: [{ weekday, shift, isAvailable }],          // grade semanal
    exceptions: [{ date, shift, isAvailable, note? }]  // datas específicas
  }
```

#### Buscar e se candidatar

```
/marketplace/jobs → filtros (serviceType, estado, cidade)
  ↓
/marketplace/jobs/:id → detalhes + indicador de compatibilidade de agenda
  ↓
POST /api/jobs/:id/applications { content: "mensagem de apresentação" }
  ↓
Application status: SUBMITTED → Família decide
  ↓
Aceita → Conversation + Contract criados → Chat disponível
  ↓
Contrato concluído → POST /api/reviews (avaliação da família)
```

#### Responder a convites

```
InvitationsPanel → lista de convites PENDING
  ├── Aceitar → POST /api/invitations/:id/accept
  │     └── Cria JobApplication automaticamente
  └── Recusar → POST /api/invitations/:id/decline
```

---

### 12.3 Chat (ambos os papéis)

```
Candidatura aceita → Conversation criada
  ↓
/chat → lista de conversas com contagem de não lidas
  ↓
/chat/:id → ChatRoom
  ├── Conexão Ably no canal private:conversation:{conversationId}
  │     ├── Token request obtido via GET /api/ws-token
  │     └── Reconexão gerenciada pelo cliente Ably
  ├── Carregar histórico → GET /api/conversations/:id/messages?take=30
  ├── Mensagens antigas → cursor-based pagination
  ├── Enviar texto → POST /api/conversations/:id/messages { content }
  ├── Enviar com anexo → POST multipart/form-data (máx. 3 arquivos, 10 MB cada)
  ├── Respostas rápidas → POST { quickReplyKey }
  ├── Bloquear → PATCH /api/conversations/:id/block { blocked: true }
  └── Denunciar conversa → POST /api/reports { targetType: CONVERSATION }
```

---

### 12.4 Admin

#### Onboarding de admin

```
Admin existente → POST /api/admin/invites { email, expiryDays }
  ↓
Email com link → /admin/invite/accept?token=...
  ↓
Usuário autenticado → POST /api/admin/invites/accept { token }
  ↓
Role atualizado para ADMIN
```

#### Moderação de documentos

```
ModerationConsole → GET /api/admin/moderation/documents (status: UNDER_REVIEW)
  ↓
Revisar → POST /api/admin/documents/:id/review
  ├── { action: "APPROVE" } → status VERIFIED
  │     └── Atualiza verificationStatus do profissional se todos aprovados
  └── { action: "REJECT", reason? } → status REJECTED
        └── Notifica profissional por in-app + email
```

#### Moderação de usuários

```
PendingUsersPanel → usuários com status PENDING (cadastro local)
  ↓
POST /api/admin/users/:id/status { status: "ACTIVE" }  → aprovação
POST /api/admin/users/:id/status { status: "SUSPENDED" }  → suspensão temporária
POST /api/admin/users/:id/status { status: "BANNED" }  → banimento permanente
```

#### Moderação de denúncias

```
GET /api/admin/moderation/reports (status: OPEN | IN_REVIEW)
  ↓
POST /api/admin/reports/:id/resolve
  ├── { action: "RESOLVE", notes? } → status RESOLVED
  └── { action: "DISMISS", notes? } → status DISMISSED
        └── Notifica denunciante
```

#### Métricas

```
GET /api/admin/metrics?window=7|30|90
  → novos usuários, candidaturas, contratos, denúncias, documentos no período
```

---

## 13. Ciclo de vida central

```
[Família cria vaga]
        ↓
[Profissional se candidata]  ←→  [Família convida profissional]
        ↓                                    ↓
[Família aceita candidatura / Profissional aceita convite]
        ↓
[Contrato IN_PROGRESS + Conversation criada]
        ↓
[Chat em tempo real (Ably)]
        ↓
[Família ou Profissional conclui contrato]
        ↓
[Avaliações mútuas]
```

---

## 14. Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `AUTH_SECRET` | Sim | Segredo de 32+ chars para JWT/sessão |
| `ABLY_API_KEY` | Sim em produção | Chave privada usada para token request e publicação Ably |
| `DATABASE_URL` | Sim | PostgreSQL connection string |
| `AUTH_GOOGLE_ID` | Não | Client ID OAuth Google |
| `AUTH_GOOGLE_SECRET` | Não | Client secret OAuth Google |
| `MOBILE_GOOGLE_CLIENT_IDS` | Não | Lista separada por vírgulas de audiences Google aceitas pelo app mobile |
| `WORDPRESS_URL` | Não | URL base WordPress (sem trailing slash) |
| `WP_USER` | Não | Usuário WordPress para upload |
| `WP_APP_PASS` | Não | Application password WordPress |
| `NEXT_PUBLIC_WORDPRESS_API_HOSTNAME` | Não | Hostname para otimização de imagens Next.js |
| `RESEND_API_KEY` | Não | API key Resend para emails |
| `RESEND_FROM_EMAIL` | Não | Endereço remetente dos emails |
| `NEXT_PUBLIC_APP_URL` | Não | URL pública do app |
| `LOCAL_UPLOAD_DIR` | Não | Diretório de uploads locais (padrão: `./uploads`) |
| `HOST` | Não | Host do servidor (padrão: `localhost`) |
| `PORT` | Não | Porta do servidor (padrão: `3000`) |

### Mobile e release

O aplicativo Expo usa as seguintes variáveis no escopo de `CuidouApp`:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_SENTRY_DSN`
- `EXPO_PUBLIC_APP_ENV`
- `EXPO_PUBLIC_APP_RELEASE`

Essas variáveis são opcionais em desenvolvimento, mas ambiente e release devem ser definidos em builds de preview/produção para permitir rastreabilidade no Sentry.
