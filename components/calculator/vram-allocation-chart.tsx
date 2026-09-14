"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

import { VramAllocationResult } from "@/lib/types/calculator"
import { formatGiB } from "@/lib/utils"

const SEGMENT_COLORS = {
  model: "hsl(var(--chart-1))",
  kv: "hsl(var(--chart-2))",
  overhead: "hsl(var(--chart-4))",
  free: "hsl(var(--chart-3))",
}

export function VramAllocationChart({ allocation }: { allocation: VramAllocationResult }) {
  const data = [
    { name: "Model weights", value: Math.max(0, allocation.modelGiB), key: "model" },
    { name: "KV cache", value: Math.max(0, allocation.kvCacheGiB), key: "kv" },
    { name: "System overhead", value: Math.max(0, allocation.overheadGiB), key: "overhead" },
    { name: "Free", value: Math.max(0, allocation.freeGiB), key: "free" },
  ]

  return (
    <div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={[{ name: "VRAM" }]} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <XAxis type="number" hide domain={[0, allocation.totalGiB || 1]} />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(value: number, name) => [formatGiB(value), name]}
          />
          {data.map((segment) => (
            <Bar key={segment.key} dataKey={() => segment.value} name={segment.name} stackId="vram" fill={SEGMENT_COLORS[segment.key as keyof typeof SEGMENT_COLORS]} radius={2} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
        {data.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[segment.key as keyof typeof SEGMENT_COLORS] }} />
            <span className="text-muted-foreground">{segment.name}</span>
            <span className="ml-auto font-medium tabular-nums">{formatGiB(segment.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
