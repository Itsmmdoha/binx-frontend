// Client-side vault redirect utility
export const handleVaultRedirect = (pathname: string): string | null => {
  // Remove leading slash and check if it's a potential vault name
  const vaultName = pathname.slice(1)

  // Skip known routes
  const knownRoutes = ["login", "create-account", "vault", "vault-access", "_next", "api", "favicon.ico"]

  // If it's empty (home) or a known route, don't redirect
  if (!vaultName || knownRoutes.some((route) => vaultName.startsWith(route))) {
    return null
  }

  // If it looks like a vault name, return the redirect URL
  if (vaultName.match(/^[a-zA-Z0-9_-]+$/)) {
    return `/vault-access?vault=${encodeURIComponent(vaultName)}`
  }

  return null
}
