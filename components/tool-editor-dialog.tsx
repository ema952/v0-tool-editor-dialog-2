"use client"

import { BodyParamsBuilder } from "@/components/body-params-builder"
import { HeadersBuilder } from "@/components/headers-builder"
import { QueryParamsBuilder } from "@/components/query-params-builder"
import { SchemaBuilder } from "@/components/schema-builder"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { validateFolderOwnership } from "@/lib/actions/tools"
import type { KnowledgeGroupDto } from "@/lib/types/knowledge"
import type { ClientTool, ServerToolRag, ServerToolWebhook, Tool } from "@/lib/types/session"
import { validateClientTool, validateRagTool, validateUrl, validateWebhookTool } from "@/lib/validation/tool-fields"
import { validateToolName } from "@/lib/validation/tool-name"
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Code2,
  Cog,
  FileText,
  Folder,
  InfoIcon,
  Loader2,
  Plus,
  Search,
  Settings2,
  Webhook,
  Wrench,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ToolEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tool: Tool | null
  onSave: (tool: Tool) => Promise<void>
  availableRagGroups: KnowledgeGroupDto[]
  forceRagType?: boolean
  initialToolType?: "client" | "knowledge" | "webhook" | null
}

export function ToolEditorDialog({
  open,
  onOpenChange,
  tool,
  onSave,
  availableRagGroups,
  forceRagType = false,
  initialToolType = null,
}: ToolEditorDialogProps) {
  const router = useRouter()

  const [toolType, setToolType] = useState<"client" | "knowledge" | "webhook" | "system">(
    forceRagType ? "knowledge" : initialToolType || "webhook",
  )
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [description, setDescription] = useState("")
  const [descriptionError, setDescriptionError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [url, setUrl] = useState("")
  const [urlError, setUrlError] = useState("")
  const [method, setMethod] = useState("POST")
  const [headers, setHeaders] = useState("")
  const [headersError, setHeadersError] = useState("")
  const [queryParams, setQueryParams] = useState("")
  const [queryParamsError, setQueryParamsError] = useState("")
  const [webhookParameters, setWebhookParameters] = useState("")
  const [webhookParametersError, setWebhookParametersError] = useState("")
  const [awaitResponse, setAwaitResponse] = useState(true)
  const [clientParameters, setClientParameters] = useState("")
  const [clientParametersError, setClientParametersError] = useState("")
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [foldersError, setFoldersError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false)
  const [editMode, setEditMode] = useState<"form" | "json">("form")
  const [rawJson, setRawJson] = useState("")
  const [jsonError, setJsonError] = useState("")

  useEffect(() => {
    if (tool) {
      setName(tool.name)
      setDescription(tool.description)

      if (tool.type === "client") {
        setToolType("client")
        setClientParameters(tool.parameters ? JSON.stringify(tool.parameters, null, 2) : "")
      } else if (tool.type === "server") {
        if (tool.subtype === "knowledge") {
          setToolType("knowledge")
          setSelectedDocuments(tool.documentFolderIds || [])
        } else if (tool.subtype === "webhook") {
          setToolType("webhook")
          setUrl(tool.url)
          setMethod(tool.method)
          setHeaders(tool.headers ? JSON.stringify(tool.headers, null, 2) : "")
          setQueryParams(tool.queryParameters ? JSON.stringify(tool.queryParameters, null, 2) : "")
          setWebhookParameters(tool.parameters ? JSON.stringify(tool.parameters, null, 2) : "")
          setAwaitResponse(tool.awaitResponse ?? true)
        }
      }

      setRawJson(JSON.stringify(tool, null, 2))
    } else {
      setName("")
      setNameError("")
      setDescription("")
      setDescriptionError("")
      setToolType(forceRagType ? "knowledge" : initialToolType || "webhook")
      setSelectedDocuments([])
      setFoldersError("")
      setUrl("")
      setUrlError("")
      setMethod("POST")
      setHeaders("")
      setHeadersError("")
      setQueryParams("")
      setQueryParamsError("")
      setWebhookParameters("")
      setWebhookParametersError("")
      setAwaitResponse(true)
      setClientParameters("")
      setClientParametersError("")
      setExpandedFolders([])
      setRawJson("")
    }

    setEditMode("form")
    setJsonError("")
  }, [tool, open, forceRagType, initialToolType])

  const handleNameChange = (value: string) => {
    setName(value)
    const validation = validateToolName(value)
    if (!validation.valid) {
      setNameError(validation.error || "")
    } else {
      setNameError("")
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (value.trim().length > 0) {
      const validation = validateUrl(value)
      if (!validation.valid) {
        setUrlError(validation.error || "")
      } else {
        setUrlError("")
      }
    } else {
      setUrlError("")
    }
  }

  const formToJson = (): string => {
    const isFormEmpty = !name && !description

    if (isFormEmpty) {
      if (toolType === "client") {
        return JSON.stringify(
          {
            type: "client",
            name: "my_client_tool",
            description: "Describe when the AI should call this client-side function",
            parameters: {
              type: "object",
              properties: {
                param1: {
                  type: "string",
                  description: "Description of parameter",
                },
              },
              required: ["param1"],
            },
          },
          null,
          2,
        )
      } else if (toolType === "knowledge") {
        return JSON.stringify(
          {
            type: "server",
            subtype: "knowledge",
            name: "search_knowledge",
            description: "Search the knowledge base when the user asks for information",
            documentFolderIds: [],
          },
          null,
          2,
        )
      } else if (toolType === "webhook") {
        return JSON.stringify(
          {
            type: "server",
            subtype: "webhook",
            name: "call_api",
            description: "Call an external API when the user requests specific action",
            url: "https://api.example.com/endpoint",
            method: "POST",
            awaitResponse: true,
          },
          null,
          2,
        )
      }
    }

    const toolConfig: any = {
      name,
      description,
    }

    if (toolType === "client") {
      toolConfig.type = "client"
      try {
        if (clientParameters) {
          toolConfig.parameters = JSON.parse(clientParameters)
        }
      } catch (e) {
        toolConfig.parameters = clientParameters
      }
    } else if (toolType === "knowledge") {
      toolConfig.type = "server"
      toolConfig.subtype = "knowledge"
      toolConfig.documentFolderIds = selectedDocuments
    } else if (toolType === "webhook") {
      toolConfig.type = "server"
      toolConfig.subtype = "webhook"
      toolConfig.url = url
      toolConfig.method = method
      toolConfig.awaitResponse = awaitResponse

      try {
        if (headers) toolConfig.headers = JSON.parse(headers)
        if (queryParams) toolConfig.queryParameters = JSON.parse(queryParams)
        if (webhookParameters) toolConfig.parameters = JSON.parse(webhookParameters)
      } catch (e) {
        // Keep as string if invalid
      }
    }

    return JSON.stringify(toolConfig, null, 2)
  }

  const jsonToForm = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString)

      if (!parsed.type) {
        setJsonError('Missing required field: "type"')
        return false
      }

      setName(parsed.name || "")
      setDescription(parsed.description || "")

      if (parsed.type === "client") {
        setToolType("client")
        setClientParameters(parsed.parameters ? JSON.stringify(parsed.parameters, null, 2) : "")
      } else if (parsed.type === "server") {
        if (!parsed.subtype) {
          setJsonError('Server tools must have a "subtype" field')
          return false
        }

        if (parsed.subtype === "knowledge") {
          setToolType("knowledge")
          setSelectedDocuments(parsed.documentFolderIds || [])
        } else if (parsed.subtype === "webhook") {
          setToolType("webhook")
          setUrl(parsed.url || "")
          setMethod(parsed.method || "POST")
          setAwaitResponse(parsed.awaitResponse ?? true)
          setHeaders(parsed.headers ? JSON.stringify(parsed.headers, null, 2) : "")
          setQueryParams(parsed.queryParameters ? JSON.stringify(parsed.queryParameters, null, 2) : "")
          setWebhookParameters(parsed.parameters ? JSON.stringify(parsed.parameters, null, 2) : "")
        } else {
          setJsonError(`Invalid subtype: "${parsed.subtype}". Must be "knowledge" or "webhook"`)
          return false
        }
      } else {
        setJsonError(`Invalid type: "${parsed.type}". Must be "client" or "server"`)
        return false
      }

      setJsonError("")
      return true
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON syntax")
      return false
    }
  }

  const handleSwitchToJson = () => {
    const json = formToJson()
    setRawJson(json)
    setEditMode("json")
  }

  const handleSwitchToForm = async () => {
    if (rawJson.trim()) {
      const success = jsonToForm(rawJson)
      if (!success) {
        return
      }

      try {
        const parsed = JSON.parse(rawJson)
        if (parsed.type === "server" && parsed.subtype === "knowledge" && parsed.documentFolderIds?.length > 0) {
          const folderValidation = await validateFolderOwnership(parsed.documentFolderIds)

          if (!folderValidation.valid) {
            setJsonError(folderValidation.error || "Invalid folder IDs")
            return
          }
        }
      } catch (error) {
        return
      }

      setEditMode("form")
      toast.success("Switched to form editor")
    } else {
      setEditMode("form")
    }
  }

  const handleSave = async () => {
    if (editMode === "json") {
      if (!rawJson.trim()) {
        setJsonError("JSON cannot be empty")
        toast.error("JSON cannot be empty")
        return
      }

      try {
        const parsed = JSON.parse(rawJson)

        if (!parsed.name) {
          setJsonError('Tool must have a "name" field')
          toast.error('Tool must have a "name" field')
          return
        }

        if (!parsed.description) {
          setJsonError('Tool must have a "description" field')
          toast.error('Tool must have a "description" field')
          return
        }

        const nameValidation = validateToolName(parsed.name)
        if (!nameValidation.valid) {
          setJsonError(`Invalid name: ${nameValidation.error}`)
          toast.error(`Invalid name: ${nameValidation.error}`)
          return
        }

        let newTool: Tool
        let validationResult

        if (parsed.type === "client") {
          validationResult = validateClientTool({
            name: parsed.name,
            description: parsed.description,
            parameters: parsed.parameters ? JSON.stringify(parsed.parameters) : "",
          })

          if (!validationResult.valid) {
            const errorMsg = Object.values(validationResult.errors).find((e) => e)
            setJsonError(errorMsg || "Validation failed")
            toast.error(errorMsg || "Validation failed")
            return
          }

          newTool = parsed as ClientTool
        } else if (parsed.type === "server") {
          if (parsed.subtype === "knowledge") {
            validationResult = validateRagTool({
              name: parsed.name,
              description: parsed.description,
              documentFolderIds: parsed.documentFolderIds || [],
            })

            if (!validationResult.valid) {
              const errorMsg = Object.values(validationResult.errors).find((e) => e)
              setJsonError(errorMsg || "Validation failed")
              toast.error(errorMsg || "Validation failed")
              return
            }

            setIsSaving(true)

            const folderValidation = await validateFolderOwnership(parsed.documentFolderIds || [])

            if (!folderValidation.valid) {
              setJsonError(folderValidation.error || "Invalid folder IDs")
              toast.error(folderValidation.error || "Invalid folder IDs")
              setIsSaving(false)
              return
            }

            newTool = parsed as ServerToolRag
          } else if (parsed.subtype === "webhook") {
            validationResult = validateWebhookTool({
              name: parsed.name,
              description: parsed.description,
              url: parsed.url || "",
              headers: parsed.headers ? JSON.stringify(parsed.headers) : "",
              queryParameters: parsed.queryParameters ? JSON.stringify(parsed.queryParameters) : "",
              parameters: parsed.parameters ? JSON.stringify(parsed.parameters) : "",
            })

            if (!validationResult.valid) {
              const errorMsg = Object.values(validationResult.errors).find((e) => e)
              setJsonError(errorMsg || "Validation failed")
              toast.error(errorMsg || "Validation failed")
              return
            }

            newTool = parsed as ServerToolWebhook
          } else {
            setJsonError('Invalid tool subtype. Must be "knowledge" or "webhook"')
            toast.error("Invalid tool subtype")
            return
          }
        } else {
          setJsonError('Invalid tool type. Must be "client" or "server"')
          toast.error("Invalid tool type")
          return
        }

        if (!isSaving) {
          setIsSaving(true)
        }
        try {
          await onSave(newTool)
          onOpenChange(false)
        } catch (error) {
          console.error("Error saving tool:", error)
          const errorMsg = error instanceof Error ? error.message : "Failed to save tool"
          setJsonError(errorMsg)
          toast.error(errorMsg)
        } finally {
          setIsSaving(false)
        }
        return
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Invalid JSON syntax"
        setJsonError(errorMsg)
        toast.error("Invalid JSON. Please check your syntax and try again.")
        return
      }
    }

    setNameError("")
    setDescriptionError("")
    setUrlError("")
    setHeadersError("")
    setQueryParamsError("")
    setWebhookParametersError("")
    setClientParametersError("")
    setFoldersError("")

    let validationResult
    let newTool: Tool

    if (toolType === "client") {
      validationResult = validateClientTool({
        name,
        description,
        parameters: clientParameters,
      })

      if (!validationResult.valid) {
        if (validationResult.errors.name) setNameError(validationResult.errors.name)
        if (validationResult.errors.description) setDescriptionError(validationResult.errors.description)
        if (validationResult.errors.parameters) setClientParametersError(validationResult.errors.parameters)

        toast.error("Please fix the validation errors before saving")
        return
      }

      const nameValidation = validateToolName(name)
      if (!nameValidation.valid) {
        setNameError(nameValidation.error || "")
        toast.error("Invalid tool name format")
        return
      }

      let parsedParams
      try {
        parsedParams = clientParameters ? JSON.parse(clientParameters) : undefined
      } catch (e) {
        setClientParametersError("Invalid JSON syntax")
        toast.error("Invalid JSON in parameters")
        return
      }

      newTool = {
        type: "client",
        name,
        description,
        parameters: parsedParams,
      } as ClientTool
    } else if (toolType === "knowledge") {
      validationResult = validateRagTool({
        name,
        description,
        documentFolderIds: selectedDocuments,
      })

      if (!validationResult.valid) {
        if (validationResult.errors.name) setNameError(validationResult.errors.name)
        if (validationResult.errors.description) setDescriptionError(validationResult.errors.description)
        if (validationResult.errors.folders) setFoldersError(validationResult.errors.folders)

        toast.error("Please fix the validation errors before saving")
        return
      }

      const nameValidation = validateToolName(name)
      if (!nameValidation.valid) {
        setNameError(nameValidation.error || "")
        toast.error("Invalid tool name format")
        return
      }

      newTool = {
        type: "server",
        subtype: "knowledge",
        name,
        description,
        documentFolderIds: selectedDocuments,
      } as ServerToolRag
    } else if (toolType === "webhook") {
      validationResult = validateWebhookTool({
        name,
        description,
        url,
        headers,
        queryParameters: queryParams,
        parameters: webhookParameters,
      })

      if (!validationResult.valid) {
        if (validationResult.errors.name) setNameError(validationResult.errors.name)
        if (validationResult.errors.description) setDescriptionError(validationResult.errors.description)
        if (validationResult.errors.url) setUrlError(validationResult.errors.url)
        if (validationResult.errors.headers) setHeadersError(validationResult.errors.headers)
        if (validationResult.errors.queryParameters) setQueryParamsError(validationResult.errors.queryParameters)
        if (validationResult.errors.parameters) setWebhookParametersError(validationResult.errors.parameters)

        toast.error("Please fix the validation errors before saving")
        return
      }

      const nameValidation = validateToolName(name)
      if (!nameValidation.valid) {
        setNameError(nameValidation.error || "")
        toast.error("Invalid tool name format")
        return
      }

      let parsedHeaders
      let parsedQueryParams
      let parsedParams
      try {
        parsedHeaders = headers ? JSON.parse(headers) : undefined
        parsedQueryParams = queryParams ? JSON.parse(queryParams) : undefined
        parsedParams = webhookParameters ? JSON.parse(webhookParameters) : undefined
      } catch (e) {
        toast.error("Invalid JSON in one of the fields")
        return
      }

      newTool = {
        type: "server",
        subtype: "webhook",
        name,
        description,
        url,
        method: method as any,
        headers: parsedHeaders,
        queryParameters: parsedQueryParams,
        parameters: parsedParams,
        awaitResponse,
      } as ServerToolWebhook
    } else {
      toast.error("System tools are not yet supported")
      return
    }

    setIsSaving(true)
    try {
      await onSave(newTool)
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving tool:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save tool")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadFiles = () => {
    onOpenChange(false)
    router.push("/knowledge")
  }

  const totalFiles = availableRagGroups.reduce((sum, folder) => sum + folder.documentCount, 0)
  const shouldShowSearch = availableRagGroups.length > 5 && totalFiles > 10

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => (prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId]))
  }

  const isFolderSelected = (folderId: string) => {
    return selectedDocuments.includes(folderId)
  }

  const toggleFolderSelection = (folderId: string) => {
    if (isFolderSelected(folderId)) {
      setSelectedDocuments((prev) => prev.filter((id) => id !== folderId))
    } else {
      const newSelection = [...new Set([...selectedDocuments, folderId])]
      setSelectedDocuments(newSelection)
    }
  }

  const handleToolTypeChange = (value: string) => {
    if (value === "client") {
      setToolType("client")
    } else if (value === "knowledge") {
      setToolType("knowledge")
    } else if (value === "webhook") {
      setToolType("webhook")
    } else if (value === "system") {
      setToolType("system")
    }
  }

  const getCurrentSelectionValue = () => {
    return toolType
  }

  const getToolIcon = () => {
    if (toolType === "client") return <Wrench className="h-4 w-4" />
    if (toolType === "knowledge") return <FileText className="h-4 w-4" />
    if (toolType === "webhook") return <Webhook className="h-4 w-4" />
    if (toolType === "system") return <Cog className="h-4 w-4" />
    return null
  }

  const getToolLabel = () => {
    if (toolType === "client") return "Client"
    if (toolType === "knowledge") return "Knowledge"
    if (toolType === "webhook") return "Webhook"
    if (toolType === "system") return "System"
    return "Select tool type"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{tool ? "Edit Webhook" : forceRagType ? "Webhook" : "Tool"}</DialogTitle>
          <DialogDescription>
            {tool ? (
              "Update the knowledge configuration"
            ) : forceRagType ? (
              "Add knowledge sources for your persona to reference information during conversations. "
            ) : (
              <>
                Create a new function calling tool for your personas.{" "}
                <a
                  href="https://docs.anam.ai/concepts/tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Learn more
                </a>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-shrink-0">
          <div className="flex items-center justify-end">
            {editMode === "form" ? (
              <Button
                type="button"
                onClick={handleSwitchToJson}
                tabIndex={-1}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 bg-transparent"
              >
                <Code2 className="h-4 w-4" />
                Edit JSON
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSwitchToForm}
                tabIndex={-1}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2 bg-transparent"
              >
                <Settings2 className="h-4 w-4" />
                Edit Form
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 -mr-2 flex-1">
          {editMode === "json" ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rawJson">Tool Configuration (JSON)</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const exampleJson = JSON.stringify(
                        {
                          type: "server",
                          subtype: "webhook",
                          name: "get_weather",
                          description: "Get the current weather for a location when the user asks for it",
                          url: "https://api.weather.example.com/current",
                          method: "POST",
                          parameters: {
                            type: "object",
                            properties: {
                              location: {
                                type: "string",
                                description: "The city or location to get weather for",
                              },
                              units: {
                                type: "string",
                                enum: ["celsius", "fahrenheit"],
                                description: "Temperature units",
                              },
                            },
                            required: ["location"],
                          },
                          awaitResponse: true,
                        },
                        null,
                        2,
                      )
                      setRawJson(exampleJson)
                      setJsonError("")
                    }}
                    tabIndex={-1}
                    className="text-xs"
                  >
                    See Example
                  </Button>
                </div>
                <Textarea
                  id="rawJson"
                  value={rawJson}
                  onChange={(e) => {
                    setRawJson(e.target.value)
                    setJsonError("")
                  }}
                  placeholder={`{\n  "type": "webhook",\n  "subtype": "webhook",\n  "name": "my_tool",\n  "description": "Tool description",\n  "url": "https://api.example.com",\n  "method": "POST"\n}`}
                  className={`font-mono text-sm min-h-[400px] resize-y ${jsonError ? "border-red-500" : ""}`}
                  rows={20}
                  spellCheck={false}
                />
                {jsonError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-3">
                    <p className="text-sm text-red-600 dark:text-red-400">{jsonError}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {!forceRagType && (
                <div className="space-y-2">
                  <Label htmlFor="toolType">Type</Label>
                  <Select value={getCurrentSelectionValue()} onValueChange={handleToolTypeChange} disabled={!!tool}>
                    <SelectTrigger id="toolType">
                      <div className="flex items-center gap-2">
                        {getToolIcon()}
                        <span>{getToolLabel()}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client" className="h-auto py-6">
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4" />
                            <span>Client</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Connects to your own app&apos;s API</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="knowledge" className="h-auto py-6">
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Knowledge</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Answers from your uploaded or linked content.</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="webhook" className="h-auto py-6">
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="flex items-center gap-2">
                            <Webhook className="h-4 w-4" />
                            <span>Webhook</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Calls any external API endpoint</p>
                        </div>
                      </SelectItem>
                      <SelectItem value="system" disabled className="h-auto py-6">
                        <div className="flex items-center gap-2 opacity-50">
                          <Cog className="h-4 w-4" />
                          <span>End call</span>
                          <span className="text-[10px] text-muted-foreground">(coming soon)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {toolType === "client" && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="name">Name</Label>
                      <TooltipProvider delayDuration={500} skipDelayDuration={0}>
                        <Tooltip disableHoverableContent>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 rounded-full"
                              aria-label="Name help"
                              tabIndex={-1}
                            >
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px]" side="top">
                            <p>Choose a function name (use letters, numbers, and _ - . only)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="get_weather"
                      maxLength={64}
                      className={nameError ? "border-red-500" : ""}
                    />
                    {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="description">System Prompt</Label>
                      <TooltipProvider delayDuration={500} skipDelayDuration={0}>
                        <Tooltip disableHoverableContent>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 rounded-full"
                              aria-label="System Prompt help"
                              tabIndex={-1}
                            >
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]" side="top">
                            <p>Explain to the AI in detail how and when to use this tool and what it does</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value)
                        setDescriptionError("")
                      }}
                      placeholder="Get the current weather for a location when the user asks for it"
                      maxLength={1024}
                      rows={3}
                      className={descriptionError ? "border-red-500" : ""}
                    />
                    {descriptionError && <p className="text-xs text-red-500">{descriptionError}</p>}
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between h-8 px-2 text-xs font-normal"
                      onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                      tabIndex={-1}
                    >
                      <span className="flex items-center gap-2">
                        {isAdvancedExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        Advanced Settings
                      </span>
                    </Button>

                    {isAdvancedExpanded && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="clientParameters">Parameters Schema</Label>
                        <SchemaBuilder
                          value={clientParameters}
                          onChange={(value) => {
                            setClientParameters(value)
                            setClientParametersError("")
                          }}
                          placeholder={`{\n  "type": "object",\n  "properties": {}\n}`}
                          hideMetadata={true}
                        />
                        {clientParametersError && <p className="text-xs text-red-500">{clientParametersError}</p>}
                      </div>
                    )}
                  </div>
                </>
              )}

              {(toolType === "knowledge" || toolType === "webhook") && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="name">Name</Label>
                      <TooltipProvider delayDuration={500} skipDelayDuration={0}>
                        <Tooltip disableHoverableContent>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 rounded-full"
                              aria-label="Name help"
                              tabIndex={-1}
                            >
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px]" side="top">
                            <p>Choose a function name (use letters, numbers, and _ - . only)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder={toolType === "knowledge" ? "search_knowledge_base" : "call_webhook"}
                      maxLength={64}
                      className={nameError ? "border-red-500" : ""}
                    />
                    {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="description">System Prompt</Label>
                      <TooltipProvider delayDuration={500} skipDelayDuration={0}>
                        <Tooltip disableHoverableContent>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 rounded-full"
                              aria-label="System Prompt help"
                              tabIndex={-1}
                            >
                              <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[280px]" side="top">
                            <p>Explain to the AI in detail how and when to use this tool and what it does</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value)
                        setDescriptionError("")
                      }}
                      placeholder={
                        toolType === "knowledge"
                          ? "When users asks for more information retrieve the documents."
                          : "Call an external API endpoint when the user asks for..."
                      }
                      maxLength={1024}
                      rows={3}
                      className={descriptionError ? "border-red-500" : ""}
                    />
                    {descriptionError && <p className="text-xs text-red-500">{descriptionError}</p>}
                  </div>
                </>
              )}

              {toolType === "knowledge" && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="knowledge" className={foldersError ? "text-red-500" : ""}>
                        Files {foldersError && "*"}
                      </Label>
                      {availableRagGroups &&
                        availableRagGroups.length > 0 &&
                        availableRagGroups.some((group) => group && group.id) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleUploadFiles}
                            tabIndex={-1}
                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="mr-1.5 h-3 w-3" />
                            Upload Files
                          </Button>
                        )}
                    </div>

                    <div className="border rounded-lg bg-card overflow-hidden">
                      {availableRagGroups.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Upload documents to the Knowledge Base to get started
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleUploadFiles}
                            tabIndex={-1}
                            className="bg-background"
                          >
                            <FileText className="mr-2 h-3.5 w-3.5" />
                            Upload Files
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          {shouldShowSearch && (
                            <div className="p-3 border-b">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search documents..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-9 bg-background"
                                />
                              </div>
                            </div>
                          )}

                          <div className="max-h-[200px] overflow-y-auto overflow-x-hidden">
                            {availableRagGroups.map((folder) => {
                              const isExpanded = expandedFolders.includes(folder.id)
                              const isFolderChecked = isFolderSelected(folder.id)

                              return (
                                <div key={folder.id}>
                                  <div
                                    className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={(e) => {
                                      if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
                                        return
                                      }
                                      toggleFolderSelection(folder.id)
                                      setFoldersError("")
                                    }}
                                  >
                                    <Checkbox
                                      checked={isFolderChecked}
                                      onCheckedChange={() => {
                                        toggleFolderSelection(folder.id)
                                        setFoldersError("")
                                      }}
                                    />
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <p className="text-sm font-medium truncate flex-1 text-foreground">
                                        {folder.name}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                                        {folder.documentCount} document
                                        {folder.documentCount !== 1 ? "s" : ""}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>

                    {availableRagGroups.length > 0 && selectedDocuments.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedDocuments.length} folder
                        {selectedDocuments.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                    {foldersError && <p className="text-xs text-red-500 mt-2">{foldersError}</p>}
                  </div>
                </>
              )}

              {toolType === "webhook" && (
                <>
                  <div className="space-y-2">
                    {/* CHANGE: Added two-column label layout for Method and URL */}
                    <div className="flex gap-2">
                      <div className="w-[110px] flex-shrink-0">
                        <Label htmlFor="method">Method</Label>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="url">URL</Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={method} onValueChange={setMethod}>
                        <SelectTrigger id="method" className="w-[110px] flex-shrink-0">
                          <span className="font-medium">{method}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="PATCH">PATCH</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="https://api.example.com/endpoint"
                        className={`flex-1 ${urlError ? "border-red-500" : ""}`}
                      />
                    </div>
                    {urlError && <p className="text-xs text-red-500">{urlError}</p>}

                    <div className="flex items-center justify-between space-x-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="awaitResponse" className="cursor-pointer">
                          Wait for response
                        </Label>
                        <TooltipProvider delayDuration={500} skipDelayDuration={0}>
                          <Tooltip disableHoverableContent>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 rounded-full"
                                aria-label="Await response help"
                                tabIndex={-1}
                              >
                                <InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent align="start" side="right" sideOffset={10} className="max-w-xs">
                              <p className="text-xs mb-2">
                                <strong>Enabled (default):</strong> The LLM waits for the webhook response for 5 seconds
                                and can use the returned data in its reply.
                              </p>
                              <p className="text-xs">
                                <strong>Disabled (fire-and-forget):</strong> The webhook is called in the background
                                without waiting for a response. Use for logging, notifications, or long-running
                                operations.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Switch id="awaitResponse" checked={awaitResponse} onCheckedChange={setAwaitResponse} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-between h-8 px-2 text-xs font-normal"
                      onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                      tabIndex={-1}
                    >
                      <span className="flex items-center gap-2">
                        {isAdvancedExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        Advanced Settings
                      </span>
                    </Button>

                    {isAdvancedExpanded && (
                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <HeadersBuilder
                            value={headers}
                            onChange={(value) => {
                              setHeaders(value)
                              setHeadersError("")
                            }}
                          />
                          {headersError && <p className="text-xs text-red-500">{headersError}</p>}
                        </div>

                        <div className="space-y-2">
                          <QueryParamsBuilder
                            value={queryParams}
                            onChange={(value) => {
                              setQueryParams(value)
                              setQueryParamsError("")
                            }}
                          />
                          {queryParamsError && <p className="text-xs text-red-500">{queryParamsError}</p>}
                        </div>

                        <div className="space-y-2">
                          <BodyParamsBuilder
                            value={webhookParameters}
                            onChange={(value) => {
                              setWebhookParameters(value)
                              setWebhookParametersError("")
                            }}
                          />
                          {webhookParametersError && <p className="text-xs text-red-500">{webhookParametersError}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tool
              ? forceRagType
                ? "Update Knowledge"
                : "Update Tool"
              : forceRagType
                ? "Create Knowledge"
                : "Create Tool"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
