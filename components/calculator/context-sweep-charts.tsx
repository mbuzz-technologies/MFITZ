"use client"

import * as React from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

import { CalculatorState } from "@/lib/types/calculator"
import { contextPresets } from "@/lib/presets"
import { computeCalculatorResults } from "@/lib/calculations/engine"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

function useSweep(state: CalculatorState) {
  return React.useMemo(
    () =>
      contextPresets.map((preset) => {
        const results = computeCalculatorResults({ ...state, contextTokens: preset.tokens })
        return {
          label: preset.label,
          tokens: preset.tokens,
          concurrency: results.concurrency.recommendedSustainable,
          tokPerSec: results.performance.estimatedTokensPerSecond,
          isCurrent: preset.tokens === state.contextTokens,
        }
      }),
    [state]
  )
}

const chartMargin = { top: 8, right: 12, bottom: 0, left: -18 }

export function ContextConcurrencyChart({ state }: { state: CalculatorState }) {
  const data = useSweep(state)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Context length vs. concurrency</CardTitle>
        <CardDescription>Recommended sustainable concurrent requests as context length grows (other settings held fixed).</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [`${value}`, "Recommended concurrency"]}
            />
            <Line type="monotone" dataKey="concurrency" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ContextThroughputChart({ state }: { state: CalculatorState }) {
  const data = useSweep(state)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Context length vs. estimated tok/s</CardTitle>
        <CardDescription>Estimated throughput decreases as context grows (more attention work per decode step).</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [`${value} tok/s`, "Estimated throughput"]}
            />
            <Line type="monotone" dataKey="tokPerSec" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
