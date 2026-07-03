import {
  LayoutDashboard,
  Users,
  Package,
  FileSearch,
  ShoppingCart,
  Wrench,
  UserCog,
  DollarSign,
  ClipboardList,
  Calculator,
  Building2,
  Wallet,
  Shield,
  Settings,
  IdCard,
  Banknote,
  Truck,
  UserPlus,
  Plus,
  type LucideIcon,
} from 'lucide-react'

export const SIDEBAR_ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Users, Package, FileSearch, ShoppingCart,
  Wrench, UserCog, DollarSign, ClipboardList, Calculator,
  Building2, Wallet, Shield, Settings, IdCard, Banknote,
  Truck, UserPlus, Plus,
}

export function resolveIcon(name?: string, fallbackName?: string): LucideIcon {
  return (name && SIDEBAR_ICON_MAP[name]) || (fallbackName && SIDEBAR_ICON_MAP[fallbackName]) || Package
}

type ColorRole = 'accent' | 'success' | 'warning' | 'danger' | 'pro' | 'default'

export const COLOR_TO_ROLE: Record<string, ColorRole> = {
  indigo: 'accent',
  emerald: 'success',
  amber: 'warning',
  rose: 'danger',
  violet: 'pro',
  sky: 'accent',
}

export const ROLE_ICON_STYLES: Record<ColorRole, string> = {
  accent: 'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  pro: 'text-violet-600 dark:text-violet-400',
  default: 'text-muted-foreground',
}
