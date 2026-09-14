import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = { title: "Documentation — MFITZ" }

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="prose-sm max-w-none space-y-3 text-sm leading-relaxed text-foreground/90">{children}</CardContent>
    </Card>
  )
}

const TOC = [
  { id: "memory", label: "Model memory" },
  { id: "quantization", label: "Quantization" },
  { id: "kv-cache", label: "KV cache" },
  { id: "context", label: "Context length" },
  { id: "concurrency", label: "Concurrency" },
  { id: "moe", label: "Mixture-of-Experts" },
  { id: "multi-gpu", label: "Multi-GPU inference" },
  { id: "disclaimer", label: "Accuracy & disclaimer" },
]

export default function DocsPage() {
  return (
    <main className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
        <nav className="hidden lg:block sticky top-20 self-start space-y-1 text-sm">
          {TOC.map((item) => (
            <a key={item.id} href={`#${item.id}`} className="block rounded-md px-2 py-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="space-y-5 max-w-3xl">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Documentation</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The concepts and formulas behind every number in the calculator.
            </p>
          </div>

          <Section id="memory" title="Model memory">
            <p>
              Model weight memory is the VRAM needed just to hold a model's parameters. For a model with{" "}
              <code>P</code> parameters at <code>b</code> bits per parameter:
            </p>
            <pre className="rounded-md bg-secondary/50 p-3 font-mono text-xs overflow-x-auto">bytes = P × b / 8</pre>
            <p>
              We multiply that theoretical figure by a small implementation-overhead factor (roughly 1.0–1.25x
              depending on quantization scheme) to account for quantization scales, codebooks, and other metadata
              that real checkpoints carry alongside the raw weights.
            </p>
          </Section>

          <Section id="quantization" title="Quantization">
            <p>
              Quantization trades numeric precision for memory and speed. MFITZ supports FP32, FP16, BF16, INT8,
              INT4, and INT3:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>FP32</strong> — 32-bit float, the training baseline. Rarely used for inference.</li>
              <li><strong>FP16 / BF16</strong> — 16-bit float, the common inference default. Half the memory of FP32.</li>
              <li><strong>INT8</strong> — 8-bit integer quantization (LLM.int8, GPTQ-8, AWQ-8). ~4x smaller than FP32.</li>
              <li><strong>INT4</strong> — 4-bit integer quantization (GPTQ, AWQ, GGUF Q4). The most common self-hosting choice — ~8x smaller than FP32 with modest quality loss.</li>
              <li><strong>INT3</strong> — More aggressive still; noticeable quality loss on most model families.</li>
            </ul>
            <p>The performance modifier attached to each format is a heuristic, not a benchmark — see the disclaimer below.</p>
          </Section>

          <Section id="kv-cache" title="KV cache">
            <p>
              During generation, transformer models cache the Key and Value tensors for every previous token so they
              don't need to be recomputed. This cache grows linearly with sequence length and is often the largest
              memory consumer in a production deployment — larger than the model weights once you have long
              contexts or many concurrent requests. The formula:
            </p>
            <pre className="rounded-md bg-secondary/50 p-3 font-mono text-xs overflow-x-auto">
              bytes = 2 × layers × KV_heads × head_dimension × tokens × bytes_per_element
            </pre>
            <p>
              The leading 2 accounts for both the Key and Value tensors. Critically, this uses <strong>KV heads</strong>,
              not attention heads — grouped-query attention (GQA) and multi-query attention (MQA) share KV heads
              across several attention heads specifically to shrink this cache, so architecture metadata matters more
              than raw parameter count here.
            </p>
          </Section>

          <Section id="context" title="Context length">
            <p>
              Context length is the maximum sequence length (prompt + generated tokens) a deployment is configured
              to handle. We calculate two scenarios:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Worst case</strong> — every concurrent request fills its entire context window. Sets the true ceiling.</li>
              <li><strong>Typical</strong> — scaled by an "average context utilization" you set, since real traffic rarely maxes out the window. Used for the headline memory/concurrency numbers.</li>
            </ul>
          </Section>

          <Section id="concurrency" title="Concurrency">
            <p>
              Once model weights and framework overhead are accounted for, whatever VRAM remains is divided among
              concurrent requests' KV caches:
            </p>
            <pre className="rounded-md bg-secondary/50 p-3 font-mono text-xs overflow-x-auto">
              theoretical_max = vram_remaining / kv_cache_per_request{"\n"}
              recommended = theoretical_max × (1 − safety_margin)
            </pre>
            <p>
              The safety margin exists because real deployments rarely want to run at the theoretical ceiling —
              memory fragmentation, allocator overhead, and bursty request sizes all eat into that headroom in
              practice.
            </p>
          </Section>

          <Section id="moe" title="Mixture-of-Experts (MoE)">
            <p>
              MoE models route each token through a small subset of "expert" sub-networks rather than the full
              parameter set. This creates two different numbers that matter for different things:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Total parameters</strong> — every expert's weights sit in VRAM regardless of whether they're active for a given token, so this drives <em>memory residency</em>.</li>
              <li><strong>Active parameters</strong> — only the routed experts (typically 2 of 8) do compute work per token, so this drives <em>throughput/latency estimates</em>.</li>
            </ul>
            <p>
              A Mixtral 8x7B model, for example, has ~46.7B total parameters (memory footprint of a ~47B dense
              model) but only ~12.9B active per token (throughput closer to a ~13B dense model).
            </p>
          </Section>

          <Section id="multi-gpu" title="Multi-GPU inference">
            <p>
              Aggregate VRAM and memory bandwidth scale linearly with GPU count — each card brings its own memory
              and its own memory controller. Achieved <em>throughput</em> does not scale linearly, because splitting
              a model across GPUs (tensor or pipeline parallelism) introduces cross-GPU communication that a single
              GPU never pays for. We model that as a power-law: throughput scales with{" "}
              <code>gpu_count^exponent</code>, using a higher exponent for GPUs on a fast interconnect (NVLink,
              NVSwitch, Infinity Fabric) than for PCIe-only setups.
            </p>
          </Section>

          <Section id="disclaimer" title="Accuracy & disclaimer">
            <p>
              <strong>MFITZ is an estimation and infrastructure-planning tool, not an actual LLM inference
              server.</strong> Every throughput and latency number is explicitly a heuristic estimate, derived from
              GPU memory bandwidth, effective model size, quantization, context length, and multi-GPU scaling — it
              is not a benchmark result.
            </p>
            <p>Real-world results vary — often substantially — depending on:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Model architecture and implementation details beyond what's captured here</li>
              <li>The inference framework (vLLM, TGI, llama.cpp, TensorRT-LLM, etc.)</li>
              <li>CUDA/kernel implementation and how well-optimized it is for your GPU</li>
              <li>Batching strategy and scheduler behavior under real traffic</li>
              <li>Actual context usage patterns vs. the "average utilization" assumption</li>
              <li>KV-cache precision and any cache-compression techniques in use</li>
              <li>Memory fragmentation over the lifetime of a long-running server process</li>
              <li>GPU topology and interconnect (PCIe generation, NVLink domain size, NUMA effects)</li>
            </ul>
            <p>Always validate a configuration against a real deployment before committing hardware budget.</p>
          </Section>
        </div>
      </div>
    </main>
  )
}
