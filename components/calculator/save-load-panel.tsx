"use client"

import * as React from "react"
import { Save, Trash2, FolderOpen } from "lucide-react"

import { CalculatorState, SavedConfiguration } from "@/lib/types/calculator"
import { listSavedConfigurations, saveConfiguration, deleteConfiguration, isStorageAvailable } from "@/lib/storage"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function SaveLoadPanel({ state, onLoad }: { state: CalculatorState; onLoad: (state: CalculatorState) => void }) {
  const [name, setName] = React.useState("")
  const [saved, setSaved] = React.useState<SavedConfiguration[]>([])
  const [available, setAvailable] = React.useState(true)

  React.useEffect(() => {
    setAvailable(isStorageAvailable())
    setSaved(listSavedConfigurations())
  }, [])

  function handleSave() {
    const config = saveConfiguration(name || `Config ${new Date().toLocaleString()}`, state)
    if (config) {
      setSaved(listSavedConfigurations())
      setName("")
    }
  }

  function handleDelete(id: string) {
    deleteConfiguration(id)
    setSaved(listSavedConfigurations())
  }

  if (!available) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved configurations</CardTitle>
        <CardDescription>Stored locally in this browser (localStorage) — never sent anywhere.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Configuration name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="sm" onClick={handleSave} title="Save current configuration">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>

        {saved.length > 0 && (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {saved.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.savedAt).toLocaleString()}</div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLoad(c.state)} title="Load">
                    <FolderOpen className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
