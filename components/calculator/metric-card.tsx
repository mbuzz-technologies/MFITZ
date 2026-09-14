import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { InfoTooltip } from "@/components/calculator/info-tooltip"
import { cn } from "@/lib/utils"

export function MetricCard({
  label,
  value,
  sub,
  tooltip,
  tone = "default",
  icon,
}: {
  label: string
  value: string
  sub?: string
  tooltip?: string
  tone?: "default" | "success" | "warning" | "destructive"
  icon?: React.ReactNode
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  }[tone]

  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {icon}
            {label}
          </div>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <div className={cn("text-2xl font-bold tabular-nums", toneClass)}>{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  )
}
