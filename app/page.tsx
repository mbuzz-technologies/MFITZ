/**
 * Home page — overview, branding, and entry points into the tool.
 */

import Link from "next/link"
import { Gauge, ArrowRight, Cpu, Database, LineChart, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const FEATURES = [
  {
    icon: Cpu,
    title: "Architecture-aware KV cache",
    description: "Uses layers, KV heads, and head dimension — not just parameter count — so GQA/MQA models get accurate cache estimates.",
  },
  {
    icon: Database,
    title: "MoE-aware performance",
    description: "Mixture-of-Experts models keep every expert resident in VRAM, but only active parameters drive throughput estimates.",
  },
  {
    icon: LineChart,
    title: "Transparent estimates",
    description: "Every number traces back to a labeled formula with your actual values substituted in — nothing is a black box.",
  },
  {
    icon: Share2,
    title: "Shareable & saveable",
    description: "Configurations live in the URL and can be saved locally, exported as JSON, or printed as a report.",
  },
]

export default function HomePage() {
  return (
    <main>
      <section className="container py-16 sm:py-24">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Gauge className="h-3.5 w-3.5 text-primary" />
            Client-side capacity planning — nothing leaves your browser
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance">
            Know your VRAM budget before you buy hardware.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl">
            Ballast estimates GPU memory, KV-cache footprint, concurrency, and throughput for self-hosted LLM
            inference — so you can plan hardware instead of guessing.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/calculator">
                Open the calculator <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/reverse">Find a GPU for my model</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardHeader>
                <f.icon className="h-5 w-5 text-primary mb-1" />
                <CardTitle className="text-sm">{f.title}</CardTitle>
                <CardDescription>{f.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/compare" className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader>
                <CardTitle>Compare GPUs &amp; models</CardTitle>
                <CardDescription>Put two hardware or model configurations side by side.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/reverse" className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader>
                <CardTitle>Reverse lookup</CardTitle>
                <CardDescription>Give us a model, quantization, context, and concurrency target — get recommended GPU configurations.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/docs" className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader>
                <CardTitle>How it works</CardTitle>
                <CardDescription>Read about the formulas behind memory, KV cache, quantization, and throughput estimates.</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="container py-8 text-xs text-muted-foreground max-w-3xl">
          <strong className="text-foreground">This is an estimation and infrastructure-planning tool</strong>, not
          an actual inference server. Real-world results vary with model architecture, inference framework,
          CUDA/kernel implementation, batching, context usage, KV precision, memory fragmentation, and GPU topology.
          Always validate against a real deployment before committing budget.
        </div>
      </section>
    </main>
  )
}
