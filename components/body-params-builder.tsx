"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"
import { useState } from "react"

interface BodyParam {
  id: string
  dataType: "string" | "number" | "boolean" | "array" | "object"
  identifier: string
  required: boolean
  valueType: "llm_prompt" | "static"
  description: string
  enumValues: string[]
}

interface BodyParamsBuilderProps {
  value: string
  onChange: (value: string) => void
}

export function BodyParamsBuilder({ value, onChange }: BodyParamsBuilderProps) {
  const [params, setParams] = useState<BodyParam[]>(() => {
    try {
      if (!value) return []
      const parsed = JSON.parse(value)
      if (parsed.type === "object" && parsed.properties) {
        return Object.entries(parsed.properties).map(([key, val]: [string, any]) => ({
          id: Math.random().toString(36).substr(2, 9),
          dataType: (val.type || "string") as any,
          identifier: key,
          required: parsed.required?.includes(key) || false,
          valueType: "llm_prompt" as const,
          description: val.description || "",
          enumValues: val.enum || [],
        }))
      }
      return []
    } catch {
      return []
    }
  })

  const [enumInputs, setEnumInputs] = useState<Record<string, string>>({})

  const updateParams = (newParams: BodyParam[]) => {
    setParams(newParams)
    const properties: Record<string, any> = {}
    const required: string[] = []

    newParams.forEach((param) => {
      if (param.identifier) {
        properties[param.identifier] = {
          type: param.dataType,
          description: param.description,
          ...(param.enumValues.length > 0 && { enum: param.enumValues }),
        }
        if (param.required) {
          required.push(param.identifier)
        }
      }
    })

    const schema = {
      type: "object",
      properties,
      ...(required.length > 0 && { required }),
    }

    onChange(JSON.stringify(schema, null, 2))
  }

  const addParam = () => {
    const newParam: BodyParam = {
      id: Math.random().toString(36).substr(2, 9),
      dataType: "string",
      identifier: "",
      required: false,
      valueType: "llm_prompt",
      description: "",
      enumValues: [],
    }
    updateParams([...params, newParam])
  }

  const removeParam = (id: string) => {
    updateParams(params.filter((p) => p.id !== id))
    const newEnumInputs = { ...enumInputs }
    delete newEnumInputs[id]
    setEnumInputs(newEnumInputs)
  }

  const updateParam = (id: string, field: keyof BodyParam, value: any) => {
    updateParams(params.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const addEnumValue = (paramId: string) => {
    const inputValue = enumInputs[paramId]?.trim()
    if (!inputValue) return

    const param = params.find((p) => p.id === paramId)
    if (param && !param.enumValues.includes(inputValue)) {
      updateParam(paramId, "enumValues", [...param.enumValues, inputValue])
      setEnumInputs({ ...enumInputs, [paramId]: "" })
    }
  }

  const removeEnumValue = (paramId: string, value: string) => {
    const param = params.find((p) => p.id === paramId)
    if (param) {
      updateParam(
        paramId,
        "enumValues",
        param.enumValues.filter((v) => v !== value),
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Body parameters</h3>
          <p className="text-sm text-muted-foreground">
            Define parameters that will be collected by the LLM and sent in the request body.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addParam}>
          Add param
        </Button>
      </div>

      {params.length > 0 && (
        <div className="space-y-4">
          {params.map((param) => (
            <div key={param.id} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data type</Label>
                  <Select value={param.dataType} onValueChange={(val: any) => updateParam(param.id, "dataType", val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="array">Array</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Identifier</Label>
                  <Input
                    value={param.identifier}
                    onChange={(e) => updateParam(param.id, "identifier", e.target.value)}
                    placeholder="param_name"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`required-${param.id}`}
                  checked={param.required}
                  onCheckedChange={(checked) => updateParam(param.id, "required", checked)}
                />
                <Label htmlFor={`required-${param.id}`} className="cursor-pointer font-normal">
                  Required
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Value Type</Label>
                <Select value={param.valueType} onValueChange={(val: any) => updateParam(param.id, "valueType", val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llm_prompt">LLM Prompt</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={param.description}
                  onChange={(e) => updateParam(param.id, "description", e.target.value)}
                  placeholder="Describe how to extract this parameter..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This field will be passed to the LLM and should describe in detail how to extract the data from the
                  transcript.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Enum Values (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={enumInputs[param.id] || ""}
                    onChange={(e) => setEnumInputs({ ...enumInputs, [param.id]: e.target.value })}
                    placeholder="Enter an enum value"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addEnumValue(param.id)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => addEnumValue(param.id)}
                    className="flex-shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {param.enumValues.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {param.enumValues.map((enumVal) => (
                      <div
                        key={enumVal}
                        className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
                      >
                        <span>{enumVal}</span>
                        <button
                          type="button"
                          onClick={() => removeEnumValue(param.id, enumVal)}
                          className="hover:bg-muted-foreground/20 rounded-sm p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add predefined values that the LLM can select from. If no values are provided, the LLM can use any{" "}
                  {param.dataType} value.
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeParam(param.id)}>
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
