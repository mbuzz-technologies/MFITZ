import { AlertTriangle, XCircle, Lightbulb } from "lucide-react"

import { CalculatorResults } from "@/lib/calculations/engine"
import { formatGiB } from "@/lib/utils"

export function WarningsPanel({ results }: { results: CalculatorResults }) {
  const { fitStatus, vramTypical, concurrency } = results
  const messages: { icon: typeof AlertTriangle; tone: "destructive" | "warning" | "info"; text: string }[] = []

  if (fitStatus.status === "NOT_FEASIBLE") {
    messages.push({
      icon: XCircle,
      tone: "destructive",
      text: `Needs ${formatGiB(Math.abs(vramTypical.freeGiB))} more VRAM than available. Try a smaller model, more aggressive quantization, a shorter context length, or an additional GPU.`,
    })
  } else if (fitStatus.status === "TIGHT") {
    messages.push({ icon: AlertTriangle, tone: "warning", text: fitStatus.detail })
  }

  for (const warning of concurrency.warnings) {
    messages.push({ icon: Lightbulb, tone: "info", text: warning })
  }

  if (messages.length === 0) return null

  return (
    <div className="space-y-2">
      {messages.map((m, i) => {
        const Icon = m.icon
        const classes = {
          destructive: "bg-destructive/10 border-destructive/30 text-destructive",
          warning: "bg-warning/10 border-warning/30 text-warning",
          info: "bg-info/10 border-info/30 text-info",
        }[m.tone]
        return (
          <div key={i} className={`flex items-start gap-2.5 rounded-md border p-3 text-sm ${classes}`}>
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="text-foreground/90">{m.text}</span>
          </div>
        )
      })}
    </div>
  )
}
