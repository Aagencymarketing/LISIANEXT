"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { NAV_MAIN, NAV_BOTTOM, type NavItem } from "./nav";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Item({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-surface-hover text-foreground"
          : "text-muted hover:bg-surface-hover hover:text-foreground",
      )}
    >
      <Icon size={19} className={cn(active ? "text-primary" : "text-muted-2")} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge && (
        <span className="rounded-md bg-surface-hover px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-2">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[264px] flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center px-5">
        <Link href="/" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_MAIN.map((item) =>
          item.children ? (
            <div key={item.href} className="pt-2">
              <div className="flex items-center gap-3 px-3 py-1.5 text-sm font-semibold text-foreground">
                <item.icon size={19} className="text-primary" />
                {item.label}
              </div>
              <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">
                {item.children.map((child) => (
                  <Item
                    key={child.href}
                    item={child}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Item
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ),
        )}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        {NAV_BOTTOM.map((item) => (
          <Item key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </div>
    </aside>
  );
}
