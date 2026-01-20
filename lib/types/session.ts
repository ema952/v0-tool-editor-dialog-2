// Tool type definitions
export type Tool = ClientTool | ServerToolRag | ServerToolWebhook

export interface ClientTool {
  type: "client"
  name: string
  description: string
  parameters?: Record<string, any>
}

export interface ServerToolRag {
  type: "server"
  subtype: "knowledge"
  name: string
  description: string
  documentFolderIds: string[]
}

export interface ServerToolWebhook {
  type: "server"
  subtype: "webhook"
  name: string
  description: string
  url: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  headers?: Record<string, string>
  queryParameters?: Record<string, any>
  parameters?: Record<string, any>
  awaitResponse?: boolean
}
