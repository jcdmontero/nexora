import { HelpCircle, FileText, HeadphonesIcon, Crown, ChevronRight, ExternalLink } from 'lucide-react'

export function SidebarFooter({ collapsed }: { collapsed?: boolean }) {
  // Colapsado: solo iconos de soporte con tooltip nativo, sin tarjeta de plan.
  if (collapsed) {
    return (
      <div className="px-2 py-2 space-y-0.5 mb-1">
        <a href="#" title="Ayuda" className="flex justify-center p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
          <HelpCircle className="w-[18px] h-[18px]" />
        </a>
        <a href="#" title="Documentación" className="flex justify-center p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
          <FileText className="w-[18px] h-[18px]" />
        </a>
        <a href="#" title="Soporte" className="flex justify-center p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
          <HeadphonesIcon className="w-[18px] h-[18px]" />
        </a>
      </div>
    )
  }

  return (
    <div className="px-4 py-2 space-y-1 mb-2">
      {/* Plan Card */}
      <div className="mb-4 p-4 rounded-xl bg-muted/60 border border-border flex flex-col items-start">
        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center mb-2">
          <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Plan Empresarial</h4>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-xs text-muted-foreground">Tu plan está activo</span>
        </div>
        <button className="mt-3 text-xs text-primary font-medium hover:underline flex items-center gap-1">
          Ver detalles del plan
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Support Links */}
      <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
        <HelpCircle className="w-4 h-4" />
        Ayuda
      </a>
      <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
        <FileText className="w-4 h-4" />
        Documentación
        <ExternalLink className="w-3 h-3 ml-auto" />
      </a>
      <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
        <HeadphonesIcon className="w-4 h-4" />
        Soporte
      </a>
    </div>
  )
}
