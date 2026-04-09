# Project Plan: Admin Missing Pages

## Objetivo
Desacoplar o monolítico `moderation-console.tsx` e implementar as páginas que estavam visíveis no menu do dashboard administrativo, mas retornavam 404: `Aprovações`, `Denúncias` e `Convites`. Tudo isso seguindo o layout "UI UX Pro Max" adotado no backoffice (OLED theme).

## Domínios Detectados
- **Frontend/UI:** UX fluida, UI em dark mode, reaproveitamento dos componentes `.theme-*`
- **Backend/API:** Consumo das APIs já existentes (`/api/admin/documents`, `/api/admin/reports`, `/api/admin/invites`)

## Agentes Escalados (Orchestration - Fase 2)
1. **frontend-specialist:** Vai construir as 3 páginas (`/approvals`, `/reports`, `/invites`) com DataTables.
2. **backend-specialist:** Garantirá que os Server Components consumam corretamente a base de dados via Prisma.
3. **test-engineer:** Validará a build do TypeScript (`yarn tsc --noEmit`) após a criação.

---

## 🏗️ Estrutura das Novas Páginas (UI/UX Pro Max)

### 1. `/admin/approvals` (Aprovações de Cadastro)
- **Foco:** Avaliar `ModerationDocument` de cuidadoras (ex: antecedentes criminais, cursos).
- **Layout:** `DataTableShell` listando documentos `PENDING`.
- **UX:** Uso integrado dos `StatusBadge` (warning para UNDER_REVIEW, success para VERIFIED). 
- **Interação:** Botões de Ação para Aprovar ou Rejeitar (com input modal/textarea para motivo).

### 2. `/admin/reports` (Denúncias e Moderação)
- **Foco:** Tratar denúncias sobre Usuários ou Vagas (Jobs).
- **Layout:** `DataTableShell` dividindo incidentes por status.
- **Interação:** Sistema de notas do admin (`reportNotesById`) e mudança de status (`IN_REVIEW`, `RESOLVED`, `DISMISSED`) baseada em requests rápidos (Server Actions ou API fetch).

### 3. `/admin/invites` (Gestão de Administradores)
- **Foco:** Emissão de convites protegidos para novos administradores.
- **Layout:** 
  1. Card superior "Novo Convite" (Input Email + Select Validade).
  2. Tabela inferior "Convites Emitidos" mostrando status (Ativos, Aceitos, Expirados).
- **UX:** Botão para Copiar link (`navigator.clipboard.writeText`) com ícone do Lucide, garantindo feedback imediato via toast (ToastProvider já existente).

---

## 🚦 Critérios de Aceitação (Verification)
- [ ] As 3 rotas existem e não quebram o layout pai.
- [ ] O componente legado `moderation-console.tsx` pode ser 100% deletado do build pois suas partes foram componentizadas.
- [ ] Contraste verificado para uso Dark Mode.
- [ ] `yarn tsc --noEmit` finaliza com código 0.
