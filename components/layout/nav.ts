import {
  Home,
  Sparkles,
  MessageSquare,
  FileSearch,
  PenLine,
  Search,
  Star,
  Briefcase,
  Clock,
  CreditCard,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavItem[];
}

export const NAV_MAIN: NavItem[] = [
  { label: "Pagina iniziale", href: "/", icon: Home },
  {
    label: "AI",
    href: "/ai",
    icon: Sparkles,
    children: [
      { label: "Risposta immediata", href: "/ai/risposta-immediata", icon: MessageSquare },
      { label: "Pareri approfonditi", href: "/ai/pareri", icon: FileSearch },
      { label: "Redattore atti", href: "/ai/redattore", icon: PenLine },
    ],
  },
  { label: "Ricerche Legali", href: "/ricerche", icon: Search },
  { label: "Preferiti", href: "/preferiti", icon: Star },
  { label: "Gestionale", href: "/gestionale", icon: Briefcase },
  { label: "Cronologia", href: "/cronologia", icon: Clock },
];

export const NAV_BOTTOM: NavItem[] = [
  { label: "Abbonamento", href: "/abbonamento", icon: CreditCard },
  { label: "Team", href: "/team", icon: Users },
  { label: "Impostazioni", href: "/impostazioni", icon: Settings, badge: "soon" },
];
