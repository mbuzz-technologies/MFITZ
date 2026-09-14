import Link from "next/link"

import { gpuPresets } from "@/lib/presets"
import { defaultCalculatorState } from "@/lib/presets"
import { encodeUrlState } from "@/lib/utils/url-state"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "GPU database — MFITZ" }

export default function GpusPage() {
  return (
    <main className="container py-8">
      <h1 className="text-xl font-bold tracking-tight">GPU database</h1>
      <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
        Representative specifications from public vendor spec sheets. Verify against the vendor before making a
        purchasing decision — memory bandwidth in particular can vary by SKU/variant.
      </p>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>{gpuPresets.length} GPUs</CardTitle>
          <CardDescription>Click a row to open it in the calculator.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Architecture</TableHead>
                <TableHead>VRAM</TableHead>
                <TableHead>Bandwidth</TableHead>
                <TableHead>Interconnect</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gpuPresets.map((gpu) => {
                const href = `/calculator${encodeUrlState({ ...defaultCalculatorState, gpu: gpu.id })}`
                return (
                  <TableRow key={gpu.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={href} className="hover:text-primary transition-colors">
                        {gpu.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{gpu.manufacturer}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{gpu.architecture}</TableCell>
                    <TableCell className="tabular-nums">{gpu.vramGiB} GiB</TableCell>
                    <TableCell className="tabular-nums">{gpu.memoryBandwidthGBs.toLocaleString()} GB/s</TableCell>
                    <TableCell className="text-muted-foreground">{gpu.interconnect ?? "—"}</TableCell>
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
