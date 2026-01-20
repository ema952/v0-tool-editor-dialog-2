// Tool field validation functions
export interface ValidationResult {
  valid: boolean
  errors: {
    name?: string
    description?: string
    url?: string
    headers?: string
    queryParameters?: string
    parameters?: string
    folders?: string
  }
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: "URL is required" }
  }

  try {
    const urlObj = new URL(url)
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }
}

function validateJsonString(value: string): { valid: boolean; error?: string } {
  if (!value || value.trim().length === 0) {
    return { valid: true } // Empty is valid (optional)
  }

  try {
    JSON.parse(value)
    return { valid: true }
  } catch {
    return { valid: false, error: "Invalid JSON syntax" }
  }
}

export function validateClientTool(data: {
  name: string
  description: string
  parameters: string
}): ValidationResult {
  const errors: ValidationResult["errors"] = {}

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Name is required"
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Description is required"
  }

  if (data.parameters) {
    const paramValidation = validateJsonString(data.parameters)
    if (!paramValidation.valid) {
      errors.parameters = paramValidation.error
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateRagTool(data: {
  name: string
  description: string
  documentFolderIds: string[]
}): ValidationResult {
  const errors: ValidationResult["errors"] = {}

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Name is required"
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Description is required"
  }

  if (!data.documentFolderIds || data.documentFolderIds.length === 0) {
    errors.folders = "At least one folder must be selected"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function validateWebhookTool(data: {
  name: string
  description: string
  url: string
  headers: string
  queryParameters: string
  parameters: string
}): ValidationResult {
  const errors: ValidationResult["errors"] = {}

  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Name is required"
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = "Description is required"
  }

  const urlValidation = validateUrl(data.url)
  if (!urlValidation.valid) {
    errors.url = urlValidation.error
  }

  if (data.headers) {
    const headersValidation = validateJsonString(data.headers)
    if (!headersValidation.valid) {
      errors.headers = headersValidation.error
    }
  }

  if (data.queryParameters) {
    const queryValidation = validateJsonString(data.queryParameters)
    if (!queryValidation.valid) {
      errors.queryParameters = queryValidation.error
    }
  }

  if (data.parameters) {
    const paramsValidation = validateJsonString(data.parameters)
    if (!paramsValidation.valid) {
      errors.parameters = paramsValidation.error
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
