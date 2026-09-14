import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

import { FitStatus } from "@/lib/types/calculator"
import { cn } from "@/lib/utils"

const STATUS_META: Record<FitStatus, { label: string; icon: typeof CheckCircle2; classes: string }> = {
  SAFE: {
    label: "Safe",
    icon: CheckCircle2,
    classes: "bg-success/15 text-success border-success/30",
  },
  TIGHT: {
    label: "Tight",
    icon: AlertTriangle,
    classes: "bg-warning/15 text-warning border-warning/30",
  },
  NOT_FEASIBLE: {
    label: "Not feasible",
    icon: XCircle,
    classes: "bg-destructive/15 text-destructive border-destructive/30",
  },
}

export function StatusBadge({ status, className }: { status: FitStatus; className?: string }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold", meta.classes, className)}>
      <Icon className="h-4 w-4" />
      {meta.label}
    </span>
  )
}
