"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  ClipboardList,
  Flag,
  Gauge,
  HeartHandshake,
  LogOut,
  Menu,
  ScrollText,
  Stethoscope,
  Users,
  X,
  Shield,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
  nested?: boolean;
  badge?: number;
};

type AdminShellProps = {
  user: { name: string | null; email: string | null };
  children: ReactNode;
  pendingCount?: number;
  reportCount?: number;
};

export function AdminShell({ user, children, pendingCount = 0, reportCount = 0 }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_ITEMS: NavItem[] = [
    { href: "/admin", label: "Dashboard", icon: Gauge },
    { href: "/admin/families", label: "Famílias", icon: HeartHandshake, nested: true },
    { href: "/admin/professionals", label: "Cuidadoras", icon: Stethoscope, nested: true },
    {
      href: "/admin/approvals",
      label: "Aprovações",
      icon: ClipboardList,
      nested: true,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      href: "/admin/reports",
      label: "Denúncias",
      icon: Flag,
      nested: true,
      badge: reportCount > 0 ? reportCount : undefined,
    },
    { href: "/admin/audit", label: "Auditoria", icon: ScrollText, nested: true },
    { href: "/admin/invites", label: "Convites", icon: Users, nested: true },
  ];

  function isActive(item: NavItem) {
    if (item.href === "/admin") {
      return pathname === "/admin";
    }
    return item.nested ? pathname.startsWith(item.href) : pathname === item.href;
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "AD";

  return (
    <div className="admin-shell">
      {/* Sidebar — desktop */}
      <aside className="admin-sidebar hidden lg:flex">
        <SidebarContent
          user={user}
          initials={initials}
          navItems={NAV_ITEMS}
          isActive={isActive}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="admin-drawer lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="admin-drawer__backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="admin-drawer__panel">
            <button
              type="button"
              aria-label="Fechar menu"
              className="admin-drawer__close"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent
              user={user}
              initials={initials}
              navItems={NAV_ITEMS}
              isActive={isActive}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      {/* Main content */}
      <div className="admin-main">
        <header className="admin-topbar lg:hidden">
          <button
            type="button"
            aria-label="Abrir menu"
            className="admin-topbar__menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--admin-accent)" }} />
            <span className="admin-topbar__title">Cuidou Admin</span>
          </div>
          {(pendingCount > 0 || reportCount > 0) && (
            <span
              className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold"
              style={{ background: "var(--admin-danger)", color: "white" }}
            >
              {pendingCount + reportCount}
            </span>
          )}
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  initials,
  navItems,
  isActive,
  onNavigate,
}: {
  user: AdminShellProps["user"];
  initials: string;
  navItems: NavItem[];
  isActive: (item: NavItem) => boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="admin-sidebar__inner">
      {/* Brand */}
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__logo">C</span>
        <div>
          <p className="admin-sidebar__title">Cuidou</p>
          <p className="admin-sidebar__subtitle">Backoffice</p>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "var(--admin-border)" }} />

      {/* Nav */}
      <nav className="admin-sidebar__nav">
        <p
          className="admin-sidebar__nav-section"
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--admin-text-dim)",
            padding: "0 0.85rem 0.35rem",
            margin: 0,
          }}
        >
          Navegação
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`admin-nav-link${active ? " admin-nav-link--active" : ""}`}
              style={{ justifyContent: "space-between" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.65rem" }}>
                <Icon size={15} aria-hidden />
                <span>{item.label}</span>
              </span>
              {item.badge ? (
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    minWidth: "1.3rem",
                    height: "1.3rem",
                    padding: "0 0.35rem",
                    borderRadius: "999px",
                    background: "var(--admin-danger)",
                    color: "white",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.badge}
                </span>
              ) : active ? (
                <ChevronRight size={12} style={{ opacity: 0.5 }} />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar__footer">
        <div className="admin-user" style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
          {/* Avatar initials */}
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--admin-accent), var(--admin-accent-strong))",
              color: "white",
              fontSize: "0.75rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {initials}
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="admin-user__name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.name ?? "Administrador"}
            </p>
            {user.email ? (
              <p className="admin-user__email" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className="admin-signout"
          style={{ width: "100%", cursor: "pointer" }}
          onClick={() => {
            void signOut({ callbackUrl: "/admin/login" });
          }}
        >
          <LogOut size={14} />
          Sair do backoffice
        </button>
      </div>
    </div>
  );
}
