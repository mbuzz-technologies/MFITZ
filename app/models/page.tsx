import Link from "next/link"

import { modelPresets, defaultCalculatorState } from "@/lib/presets"
import { encodeUrlState } from "@/lib/utils/url-state"
import { formatParams } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Model database — Ballast" }

export default function ModelsPage() {
  return (
    <main className="container py-8">
      <h1 className="text-xl font-bold tracking-tight">Model database</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        Layer/head metadata drives architecture-aware KV-cache estimation — two models with the same parameter count
        can need very different amounts of cache. MoE models list both total and active parameters.
      </p>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>{modelPresets.length} models</CardTitle>
          <CardDescription>Click a row to open it in the calculator.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Architecture</TableHead>
                <TableHead>Parameters</TableHead>
                <TableHead>Layers</TableHead>
                <TableHead>Attn / KV heads</TableHead>
                <TableHead>Head dim</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelPresets.map((model) => {
                const href = `/calculator${encodeUrlState({ ...defaultCalculatorState, model: model.id })}`
                return (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium">
                      <Link href={href} className="hover:text-primary transition-colors">
                        {model.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{model.architecture}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatParams(model.parameters)}
                      {model.isMoE && (
                        <Badge variant="secondary" className="ml-2">
                          MoE · {formatParams(model.activeParameters ?? 0)} active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{model.layers}</TableCell>
                    <TableCell className="tabular-nums">
                      {model.attentionHeads} / {model.kvHeads}
                    </TableCell>
                    <TableCell className="tabular-nums">{model.headDimension}</TableCell>
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
