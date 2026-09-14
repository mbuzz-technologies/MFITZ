/**
 * Export helpers: download the current configuration + results as JSON, or
 * trigger a print-friendly report (the results dashboard is laid out so the
 * browser print stylesheet in globals.css hides interactive chrome and
 * keeps only the report content).
 */

export function downloadJson(filename: string, data: unknown): void {
  if (typeof window === "undefined") return
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function printReport(): void {
  if (typeof window === "undefined") return
  window.print()
}
