"use client"
import { Textarea } from "@/components/ui/textarea"

interface SchemaBuilderProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hideMetadata?: boolean
  hideStrictInfo?: boolean
}

export function SchemaBuilder({
  value,
  onChange,
  placeholder = '{\n  "type": "object",\n  "properties": {}\n}',
  hideMetadata = false,
  hideStrictInfo = false,
}: SchemaBuilderProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-mono text-sm min-h-[120px] resize-y"
        rows={6}
        spellCheck={false}
      />
      {!hideStrictInfo && (
        <div className="rounded-md bg-muted/50 border border-muted p-2.5">
          <p className="text-xs text-muted-foreground">
            💡 Define a JSON schema for the parameters. The AI will use this to understand what data to collect.
          </p>
        </div>
      )}
    </div>
  )
}
