export const validateVaultName = (vaultName: string): { isValid: boolean; error?: string } => {
  // Remove whitespace
  const trimmed = vaultName.trim()

  // Check length
  if (trimmed.length < 3) {
    return { isValid: false, error: "Vault name must be at least 3 characters long" }
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: "Vault name must be less than 30 characters" }
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  const validPattern = /^[a-zA-Z0-9_-]+$/
  if (!validPattern.test(trimmed)) {
    return { isValid: false, error: "Vault name can only contain letters, numbers, hyphens, and underscores" }
  }

  // Check that it doesn't start or end with special characters
  if (trimmed.startsWith("-") || trimmed.startsWith("_") || trimmed.endsWith("-") || trimmed.endsWith("_")) {
    return { isValid: false, error: "Vault name cannot start or end with hyphens or underscores" }
  }

  // Check for reserved names
  const reservedNames = ["admin", "api", "www", "mail", "ftp", "localhost", "root", "test", "demo"]
  if (reservedNames.includes(trimmed.toLowerCase())) {
    return { isValid: false, error: "This vault name is reserved and cannot be used" }
  }

  return { isValid: true }
}

export const sanitizeVaultName = (vaultName: string): string => {
  return vaultName.trim().toLowerCase()
}
