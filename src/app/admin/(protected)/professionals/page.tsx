import { DataTableShell } from "@/components/theme/data-table-shell";
import { PageHeader } from "@/components/theme/page-header";
import { StatusBadge } from "@/components/theme/status-badge";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  UserRole,
  UserStatus,
  VerificationStatus,
} from "@prisma/client";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  verification?: string;
  page?: string;
}>;

function parsePage(raw: string | undefined) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function parseUserStatus(raw: string | undefined): UserStatus | null {
  if (!raw) return null;
  if ((Object.values(UserStatus) as string[]).includes(raw)) {
    return raw as UserStatus;
  }
  return null;
}

function parseVerification(
  raw: string | undefined,
): VerificationStatus | null {
  if (!raw) return null;
  if ((Object.values(VerificationStatus) as string[]).includes(raw)) {
    return raw as VerificationStatus;
  }
  return null;
}

function statusTone(status: UserStatus) {
  switch (status) {
    case "ACTIVE":
      return "success" as const;
    case "PENDING":
      return "warning" as const;
    case "SUSPENDED":
      return "info" as const;
    case "BANNED":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

function verificationTone(v: VerificationStatus) {
  switch (v) {
    case "VERIFIED":
      return "success" as const;
    case "REJECTED":
      return "danger" as const;
    case "UNDER_REVIEW":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default async function AdminProfessionalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolved = await searchParams;
  const q = (resolved.q ?? "").trim();
  const statusFilter = parseUserStatus(resolved.status);
  const verificationFilter = parseVerification(resolved.verification);
  const page = parsePage(resolved.page);
  const skip = (page - 1) * PAGE_SIZE;

  const where: Prisma.UserWhereInput = {
    role: UserRole.PROFESSIONAL,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(verificationFilter
      ? { professionalProfile: { verificationStatus: verificationFilter } }
      : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            {
              professionalProfile: {
                OR: [
                  { city: { contains: q, mode: "insensitive" } },
                  { state: { contains: q, mode: "insensitive" } },
                  { bio: { contains: q, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        professionalProfile: {
          select: {
            city: true,
            state: true,
            verificationStatus: true,
            experienceYears: true,
            _count: { select: { documents: true } },
          },
        },
        _count: {
          select: { applications: true, contractsAsProfessional: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    if (verificationFilter) params.set("verification", verificationFilter);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return `/admin/professionals${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <PageHeader
        eyebrow="Usuários"
        title="Cuidadoras"
        description={`${total} profissionais cadastradas. Busque por nome, e-mail, telefone ou cidade.`}
      />

      <form
        method="get"
        className="grid gap-3 rounded-2xl border border-[var(--theme-border)] bg-[color:var(--theme-surface)] px-4 py-4 sm:grid-cols-[1fr_180px_180px_auto] sm:items-end"
      >
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Busca</span>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="nome, e-mail, telefone, cidade..."
            className="theme-field w-full"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Conta</span>
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="theme-select w-full"
          >
            <option value="">Todos</option>
            {Object.values(UserStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs uppercase tracking-[0.06em] text-[var(--theme-muted)]">Verificação</span>
          <select
            name="verification"
            defaultValue={verificationFilter ?? ""}
            className="theme-select w-full"
          >
            <option value="">Todas</option>
            {Object.values(VerificationStatus).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--brand-purple-primary)] px-5 text-sm font-medium text-white hover:bg-[var(--brand-purple-secondary)]"
        >
          Filtrar
        </button>
      </form>

      <DataTableShell
        title="Listagem de cuidadoras"
        description="Visão geral das profissionais para auditoria e decisões de verificação."
      >
        {items.length === 0 ? (
          <p className="theme-card-soft rounded-2xl px-4 py-3 text-sm text-[var(--theme-muted)]">
            Nenhuma profissional encontrada.
          </p>
        ) : (
          <div className="theme-table-wrap">
            <table className="theme-table min-w-[820px]">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>Contato</th>
                  <th>Localização</th>
                  <th>Exp.</th>
                  <th>Docs</th>
                  <th>Candidaturas</th>
                  <th>Verificação</th>
                  <th>Conta</th>
                </tr>
              </thead>
              <tbody>
                {items.map((user) => {
                  const profile = user.professionalProfile;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="flex flex-col">
                          <span>{user.name ?? "—"}</span>
                          <span className="text-xs text-[var(--theme-muted)]">{user.email ?? "—"}</span>
                        </div>
                      </td>
                      <td className="text-xs text-[var(--theme-muted)]">{user.phone ?? "—"}</td>
                      <td className="text-xs text-[var(--theme-muted)]">
                        {[profile?.city, profile?.state].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td className="text-xs text-[var(--theme-muted)]">
                        {profile?.experienceYears != null ? `${profile.experienceYears}a` : "—"}
                      </td>
                      <td>{profile?._count.documents ?? 0}</td>
                      <td>{user._count.applications}</td>
                      <td>
                        {profile ? (
                          <StatusBadge tone={verificationTone(profile.verificationStatus)}>
                            {profile.verificationStatus}
                          </StatusBadge>
                        ) : (
                          <StatusBadge tone="neutral">SEM PERFIL</StatusBadge>
                        )}
                      </td>
                      <td>
                        <StatusBadge tone={statusTone(user.status)}>{user.status}</StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                className="rounded-full border border-[var(--theme-border)] px-3 py-1.5"
              >
                ← Anterior
              </Link>
            ) : (
              <span />
            )}
            <span className="text-[var(--theme-muted)]">
              Página {page} de {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                className="rounded-full border border-[var(--theme-border)] px-3 py-1.5"
              >
                Próxima →
              </Link>
            ) : (
              <span />
            )}
          </div>
        ) : null}
      </DataTableShell>
    </>
  );
}
