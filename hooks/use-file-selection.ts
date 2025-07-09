"use client"

import { useState, useCallback } from "react"
import type { FileData } from "@/types"

export function useFileSelection(files: FileData[]) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  const toggleFileSelection = useCallback(
    (fileId: string) => {
      const newSelected = new Set(selectedFiles)
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId)
      } else {
        newSelected.add(fileId)
      }
      setSelectedFiles(newSelected)
    },
    [selectedFiles],
  )

  const selectAllFiles = useCallback(() => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map((file) => file.id)))
    }
  }, [selectedFiles.size, files])

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set())
    setIsSelectionMode(false)
  }, [])

  return {
    selectedFiles,
    isSelectionMode,
    setIsSelectionMode,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
  }
}
