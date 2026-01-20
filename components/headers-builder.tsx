"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useState } from "react"

interface Header {
  id: string
  type: "secret" | "static"
  name: string
  value: string
}

interface HeadersBuilderProps {
  value: string
  onChange: (value: string) => void
}

export function HeadersBuilder({ value, onChange }: HeadersBuilderProps) {
  const [headers, setHeaders] = useState<Header[]>(() => {
    try {
      if (!value) return []
      const parsed = JSON.parse(value)
      return Object.entries(parsed).map(([name, val]) => ({
        id: Math.random().toString(36).substr(2, 9),
        type: "static" as const,
        name,
        value: val as string,
      }))
    } catch {
      return []
    }
  })

  const updateHeaders = (newHeaders: Header[]) => {
    setHeaders(newHeaders)
    const headersObj = newHeaders.reduce(
      (acc, h) => {
        if (h.name) {
          acc[h.name] = h.value
        }
        return acc
      },
      {} as Record<string, string>,
    )
    onChange(JSON.stringify(headersObj, null, 2))
  }

  const addHeader = () => {
    const newHeader: Header = {
      id: Math.random().toString(36).substr(2, 9),
      type: "secret",
      name: "",
      value: "",
    }
    updateHeaders([...headers, newHeader])
  }

  const removeHeader = (id: string) => {
    updateHeaders(headers.filter((h) => h.id !== id))
  }

  const updateHeader = (id: string, field: keyof Header, value: string) => {
    updateHeaders(headers.map((h) => (h.id === id ? { ...h, [field]: value } : h)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Headers</h3>
          <p className="text-sm text-muted-foreground">Define headers that will be sent with the request</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addHeader}>
          Add header
        </Button>
      </div>

      {headers.length > 0 && (
        <div className="space-y-4">
          {headers.map((header) => (
            <div key={header.id} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={header.type} onValueChange={(val) => updateHeader(header.id, "type", val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="secret">Secret</SelectItem>
                      <SelectItem value="static">Static</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={header.name}
                    onChange={(e) => updateHeader(header.id, "name", e.target.value)}
                    placeholder="Authorization"
                  />
                </div>
              </div>

              {header.type === "secret" && (
                <div className="space-y-2">
                  <Label>Secret</Label>
                  <Button type="button" variant="outline" className="w-full justify-center bg-transparent" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add new secret
                  </Button>
                </div>
              )}

              {header.type === "static" && (
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    value={header.value}
                    onChange={(e) => updateHeader(header.id, "value", e.target.value)}
                    placeholder="Bearer token_here"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeHeader(header.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
