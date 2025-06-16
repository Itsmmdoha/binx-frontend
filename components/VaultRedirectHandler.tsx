"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { handleVaultRedirect } from "@/utils/vaultRedirect"

export default function VaultRedirectHandler() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const redirectUrl = handleVaultRedirect(pathname)
    if (redirectUrl) {
      router.replace(redirectUrl)
    }
  }, [pathname, router])

  return null
}
