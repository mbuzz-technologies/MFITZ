/**
 * Reverse calculator: model + quantization + context + desired concurrency
 * -> recommended GPU configurations, ranked by fit status then efficiency.
 */

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { CalculatorState } from "@/lib/types/calculator"
import { modelDatabase, contextPresets, defaultCalculatorState, recommendGpuConfigurations } from "@/lib/presets"
import { resolveModel } from "@/lib/resolve"
import { encodeUrlState } from "@/lib/utils/url-state"
import { formatGiB, formatParams } from "@/lib/utils"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { StatusBadge } from "@/components/calculator/status-badge"
import { Button } from "@/components/ui/button"

export default function ReversePage() {
  const [modelId, setModelId] = useState("70b")
  const [quantization, setQuantization] = useState<CalculatorState["quantization"]>("INT4")
  const [contextTokens, setContextTokens] = useState(8_000)
  const [concurrentRequests, setConcurrentRequests] = useState(4)

  const model = useMemo(() => resolveModel(modelId, defaultCalculatorState.customModel), [modelId])

  const recommendations = useMemo(
    () => recommendGpuConfigurations(model, quantization, contextTokens, concurrentRequests),
    [model, quantization, contextTokens, concurrentRequests]
  )

  return (
    <main className="container py-8">
      <h1 className="text-xl font-bold tracking-tight">Reverse GPU lookup</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        Tell us the model, quantization, context length, and how many concurrent requests you need — we'll rank GPU
        configurations that can serve it.
      </p>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Workload</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Select value={modelId} onValueChange={setModelId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(modelDatabase).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} — {formatParams(m.parameters)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Quantization</Label>
            <Select value={quantization} onValueChange={(v) => setQuantization(v as CalculatorState["quantization"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["FP32", "FP16", "BF16", "INT8", "INT4", "INT3"] as const).map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Context length</Label>
            <Select value={String(contextTokens)} onValueChange={(v) => setContextTokens(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contextPresets.map((p) => (
                  <SelectItem key={p.label} value={String(p.tokens)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Desired concurrent requests</Label>
            <Input type="number" min={1} value={concurrentRequests} onChange={(e) => setConcurrentRequests(Math.max(1, Number(e.target.value)))} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recommended configurations</CardTitle>
          <CardDescription>
            Ranked SAFE → TIGHT → NOT FEASIBLE, then by fewest GPUs and least wasted headroom. Assumes 50% average
            context utilization and FP16 KV cache.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>GPU</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Total VRAM</TableHead>
                <TableHead>Free VRAM</TableHead>
                <TableHead>Achieved concurrency</TableHead>
                <TableHead>Est. tok/s</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((rec, i) => {
                const href = `/calculator${encodeUrlState({
                  ...defaultCalculatorState,
                  gpu: rec.gpu.id,
                  gpuCount: rec.gpuCount,
                  model: modelId,
                  quantization,
                  contextTokens,
                  concurrentRequests,
                })}`
                return (
                  <TableRow key={`${rec.gpu.id}-${rec.gpuCount}-${i}`}>
                    <TableCell>
                      <StatusBadge status={rec.status} />
                    </TableCell>
                    <TableCell className="font-medium">{rec.gpu.name}</TableCell>
                    <TableCell className="tabular-nums">×{rec.gpuCount}</TableCell>
                    <TableCell className="tabular-nums">{formatGiB(rec.totalVramGiB)}</TableCell>
                    <TableCell className={`tabular-nums ${rec.fits ? "text-success" : "text-destructive"}`}>{formatGiB(rec.freeGiB)}</TableCell>
                    <TableCell className="tabular-nums">{rec.achievedConcurrency}</TableCell>
                    <TableCell className="tabular-nums">{rec.estimatedTokPerSec}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={href}>Open →</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
