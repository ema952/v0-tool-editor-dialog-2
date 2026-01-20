"use client"

import { ToolEditorDialog } from "@/components/tool-editor-dialog"
import { Button } from "@/components/ui/button"
import type { KnowledgeGroupDto } from "@/lib/types/knowledge"
import type { Tool } from "@/lib/types/session"
import { useState } from "react"
import { toast } from "sonner"

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentTool, setCurrentTool] = useState<Tool | null>(null)

  // Mock knowledge groups for demo
  const mockKnowledgeGroups: KnowledgeGroupDto[] = [
    { id: "1", name: "Product Documentation", documentCount: 15 },
    { id: "2", name: "User Guides", documentCount: 8 },
    { id: "3", name: "API Reference", documentCount: 23 },
  ]

  const handleSaveTool = async (tool: Tool) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log("Saved tool:", tool)
    toast.success("Tool saved successfully!")
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Tool Editor Dialog Demo</h1>
          <p className="text-muted-foreground">
            A comprehensive dialog component for creating and editing AI tools with support for client tools, knowledge
            bases, and webhooks.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={() => {
              setCurrentTool(null)
              setIsDialogOpen(true)
            }}
          >
            Create New Tool
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentTool({
                type: "server",
                subtype: "webhook",
                name: "get_weather",
                description: "Get current weather for a location",
                url: "https://api.weather.com/v1/current",
                method: "GET",
                awaitResponse: true,
              })
              setIsDialogOpen(true)
            }}
          >
            Edit Sample Webhook
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentTool({
                type: "client",
                name: "calculate_sum",
                description: "Calculate the sum of two numbers",
                parameters: {
                  type: "object",
                  properties: {
                    a: { type: "number", description: "First number" },
                    b: { type: "number", description: "Second number" },
                  },
                  required: ["a", "b"],
                },
              })
              setIsDialogOpen(true)
            }}
          >
            Edit Sample Client Tool
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-2xl font-semibold">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Dual edit modes: Form editor and JSON editor</li>
            <li>Support for three tool types: Client, Knowledge, and Webhook</li>
            <li>Real-time validation with error messages</li>
            <li>Advanced settings with collapsible sections</li>
            <li>JSON schema builder for parameters</li>
            <li>Knowledge base folder selection</li>
            <li>Webhook configuration with headers and query params</li>
            <li>Responsive design with shadcn/ui components</li>
          </ul>
        </div>
      </div>

      <ToolEditorDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        tool={currentTool}
        onSave={handleSaveTool}
        availableRagGroups={mockKnowledgeGroups}
      />
    </main>
  )
}
