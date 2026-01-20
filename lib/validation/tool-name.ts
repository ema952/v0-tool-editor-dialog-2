// Tool name validation
export function validateToolName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Name is required" }
  }

  if (name.length > 64) {
    return { valid: false, error: "Name must be 64 characters or less" }
  }

  // Only allow letters, numbers, underscores, hyphens, and periods
  const validPattern = /^[a-zA-Z0-9_.-]+$/
  if (!validPattern.test(name)) {
    return { valid: false, error: "Name can only contain letters, numbers, _, -, and ." }
  }

  return { valid: true }
}
