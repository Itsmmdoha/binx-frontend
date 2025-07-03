"use client"

import { useState, useCallback, useMemo } from "react"
import type { VaultData, FileData, VaultResponse } from "@/types"

type SortOption = "name-asc" | "name-desc" | "date-asc" | "date-desc" | "size-asc" | "size-desc"

export function useVaultData() {
  const [vaultData, setVaultData] = useState<VaultData | null>(null)
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("date-desc")

  const clearAuthAndRedirect = useCallback(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("userType")
    localStorage.removeItem("vaultName")
    window.location.href = "/login"
  }, [])

  const fetchVaultData = useCallback(
    async (token: string) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault/fetch`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data: VaultResponse = await response.json()
          setVaultData(data.vault)
          setFiles(data.files)
        } else if (response.status === 401) {
          clearAuthAndRedirect()
          return
        } else {
          console.error("Failed to fetch vault data:", response.status)
          clearAuthAndRedirect()
        }
      } catch (error) {
        console.error("Failed to fetch vault data:", error)
        clearAuthAndRedirect()
      } finally {
        setLoading(false)
      }
    },
    [clearAuthAndRedirect],
  )

  const filteredAndSortedFiles = useMemo(() => {
    const filtered = files.filter((file) => file.file.toLowerCase().includes(searchQuery.toLowerCase()))

    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.file.localeCompare(b.file)
        case "name-desc":
          return b.file.localeCompare(a.file)
        case "date-asc":
          return new Date(a.date_created).getTime() - new Date(b.date_created).getTime()
        case "date-desc":
          return new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
        case "size-asc":
          return a.size - b.size
        case "size-desc":
          return b.size - a.size
        default:
          return 0
      }
    })

    return sorted
  }, [files, searchQuery, sortOption])

  return {
    vaultData,
    files,
    loading,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    filteredAndSortedFiles,
    fetchVaultData,
    clearAuthAndRedirect,
  }
}
