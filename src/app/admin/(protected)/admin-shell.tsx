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
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
  /** true when the link should match deeper nested paths too */
  nested?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/families", label: "Famílias", icon: HeartHandshake, nested: true },
  { href: "/admin/professionals", label: "Cuidadoras", icon: Stethoscope, nested: true },
  { href: "/admin/approvals", label: "Aprovações", icon: ClipboardList, nested: true },
  { href: "/admin/reports", label: "Denúncias", icon: Flag, nested: true },
  { href: "/admin/audit", label: "Auditoria", icon: ScrollText, nested: true },
  { href: "/admin/invites", label: "Convites", icon: Users, nested: true },
];

type AdminShellProps = {
  user: { name: string | null; email: string | null };
  children: ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(item: NavItem) {
    if (item.href === "/admin") {
      return pathname === "/admin";
    }
    return item.nested ? pathname.startsWith(item.href) : pathname === item.href;
  }

  return (
    <div className="admin-shell">
      {/* Sidebar — desktop */}
      <aside className="admin-sidebar hidden lg:flex">
        <SidebarContent
          user={user}
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
          <span className="admin-topbar__title">Admin</span>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  isActive,
  onNavigate,
}: {
  user: AdminShellProps["user"];
  isActive: (item: NavItem) => boolean;
  onNavigate: () => void;
}) {
  return (
    <div className="admin-sidebar__inner">
      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__logo">C</span>
        <div>
          <p className="admin-sidebar__title">Cuidou</p>
          <p className="admin-sidebar__subtitle">Painel administrativo</p>
        </div>
      </div>

      <nav className="admin-sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`admin-nav-link${active ? " admin-nav-link--active" : ""}`}
            >
              <Icon size={16} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="admin-sidebar__footer">
        <div className="admin-user">
          <p className="admin-user__name">{user.name ?? "Administrador"}</p>
          {user.email ? <p className="admin-user__email">{user.email}</p> : null}
        </div>
        <button
          type="button"
          className="admin-signout"
          onClick={() => {
            void signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  );
}
