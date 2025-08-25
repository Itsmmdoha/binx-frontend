"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { formatFileSize } from "@/utils"
import { toast } from "@/components/ui/use-toast"
import type { VaultData, MultipartUpload } from "@/types"
import {
  shouldUseMultipart,
  createChunks,
  generateUploadId,
  initiateMultipartUpload,
  uploadChunk,
  completeMultipartUpload,
  abortMultipartUpload,
  saveIncompleteUpload,
  removeIncompleteUpload,
  calculateUploadProgress,
  getIncompleteUploadsFromAPI,
  addRunningUpload,
  removeRunningUpload,
  promptFileSelection,
  verifyFileForRetry,
  DEFAULT_CHUNK_SIZE,
} from "@/utils/multipart-upload"

interface FileUploadInfo {
  file: File
  status: "pending" | "uploading" | "completed" | "failed" | "cancelled" | "size-exceeded" | "paused"
  progress: number
  error?: string
  xhr?: XMLHttpRequest
  multipartUpload?: MultipartUpload
  pauseResolve?: () => void
}

export function useFileUpload(vaultData: VaultData | null, fetchVaultData: (token: string) => void) {
  const [uploadQueue, setUploadQueue] = useState<FileUploadInfo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentUploadIndex, setCurrentUploadIndex] = useState(-1)
  const [uploadCancelled, setUploadCancelled] = useState(false)
  const [showDetailedProgress, setShowDetailedProgress] = useState(false)
  const [batchPaused, setBatchPaused] = useState(false) // Added batch pause state to control sequential upload flow
  const activeUploadsRef = useRef<Map<string, { abort: () => void; pause: () => void; resume: () => void }>>(new Map())

  const checkStorageCapacity = useCallback(
    (filesToUpload: File[]): { canUpload: boolean; exceedsStorage: File[] } => {
      if (!vaultData) return { canUpload: false, exceedsStorage: [] }

      const availableSpace = vaultData.size - vaultData.used_storage
      let totalSizeNeeded = 0
      const exceedsStorage: File[] = []

      for (const file of filesToUpload) {
        totalSizeNeeded += file.size
        if (totalSizeNeeded > availableSpace) {
          exceedsStorage.push(...filesToUpload.slice(filesToUpload.indexOf(file)))
          break
        }
      }

      return {
        canUpload: exceedsStorage.length === 0,
        exceedsStorage,
      }
    },
    [vaultData],
  )

  const uploadFileWithMultipart = useCallback(
    async (fileInfo: FileUploadInfo, token: string): Promise<void> => {
      const { file } = fileInfo

      try {
        // Create multipart upload record
        const uploadId = generateUploadId()
        const chunks = createChunks(file, DEFAULT_CHUNK_SIZE)

        const multipartUpload: MultipartUpload = {
          id: uploadId,
          uploadId,
          fileName: file.name,
          fileSize: file.size,
          chunkSize: DEFAULT_CHUNK_SIZE,
          totalChunks: chunks.length,
          uploadedChunks: new Set(),
          status: "pending",
          createdAt: Date.now(),
          lastActivity: Date.now(),
        }

        // Update file info with multipart upload
        setUploadQueue((prev) =>
          prev.map((item) => (item.file === file ? { ...item, multipartUpload, status: "uploading" as const } : item)),
        )

        // Save to local storage
        saveIncompleteUpload(multipartUpload)

        // Initiate multipart upload with API
        const initResponse = await initiateMultipartUpload(file.name, file.size, token)

        // Update with actual file ID from API
        multipartUpload.uploadId = initResponse.file_id

        // Use the API file_id for all subsequent operations
        const fileId = initResponse.file_id
        saveIncompleteUpload(multipartUpload)

        // Add to running uploads tracking
        addRunningUpload(fileId)

        let isPaused = false
        let isAborted = false

        const uploadControls = {
          abort: () => {
            isAborted = true
            abortMultipartUpload(fileId, token).catch(console.error)
            removeIncompleteUpload(multipartUpload.id)
            removeRunningUpload(fileId)
          },
          pause: () => {
            isPaused = true
            multipartUpload.status = "paused"
            saveIncompleteUpload(multipartUpload)
          },
          resume: () => {
            isPaused = false
            multipartUpload.status = "uploading"
            saveIncompleteUpload(multipartUpload)
          },
        }

        activeUploadsRef.current.set(uploadId, uploadControls)

        // Upload chunks sequentially
        for (let i = 0; i < chunks.length; i++) {
          if (isAborted || uploadCancelled) break

          // Wait if paused
          while (isPaused && !isAborted && !uploadCancelled) {
            await new Promise((resolve) => {
              fileInfo.pauseResolve = resolve
              setTimeout(resolve, 1000) // Check every second
            })
          }

          if (isAborted || uploadCancelled) break

          const chunk = chunks[i]

          try {
            const chunkResponse = await uploadChunk(fileId, chunk.chunkNumber, chunk.data, token, (loaded, total) => {
              const chunkProgress = (loaded / total) * 100
              const overallProgress = Math.round(
                ((multipartUpload.uploadedChunks.size + chunkProgress / 100) / multipartUpload.totalChunks) * 100,
              )

              setUploadQueue((prev) =>
                prev.map((item) => (item.file === file ? { ...item, progress: overallProgress } : item)),
              )
            })

            // Mark chunk as completed
            multipartUpload.uploadedChunks.add(chunk.chunkNumber)
            multipartUpload.lastActivity = Date.now()

            // Update progress
            const progress = calculateUploadProgress(multipartUpload.uploadedChunks, multipartUpload.totalChunks)

            setUploadQueue((prev) => prev.map((item) => (item.file === file ? { ...item, progress } : item)))

            // Save progress
            saveIncompleteUpload(multipartUpload)
          } catch (error) {
            if (isAborted || uploadCancelled) break

            multipartUpload.status = "failed"
            multipartUpload.error = error instanceof Error ? error.message : "Chunk upload failed"
            saveIncompleteUpload(multipartUpload)

            setUploadQueue((prev) =>
              prev.map((item) =>
                item.file === file ? { ...item, status: "failed" as const, error: multipartUpload.error } : item,
              ),
            )

            throw error
          }
        }

        if (!isAborted && !uploadCancelled) {
          // Complete multipart upload
          try {
            const completeResponse = await completeMultipartUpload(fileId, token)

            // Mark as completed
            multipartUpload.status = "completed"
            removeIncompleteUpload(multipartUpload.id)
            removeRunningUpload(fileId)

            setUploadQueue((prev) =>
              prev.map((item) =>
                item.file === file ? { ...item, status: "completed" as const, progress: 100 } : item,
              ),
            )
          } catch (completionError) {
            const errorMessage = completionError instanceof Error ? completionError.message : "Upload completion failed"
            const status = (completionError as any)?.status

            multipartUpload.status = "failed"
            multipartUpload.error = errorMessage

            // Keep the upload data for retry if it's a non-200 response
            if (status && status !== 200) {
              saveIncompleteUpload(multipartUpload)
            } else {
              removeIncompleteUpload(multipartUpload.id)
            }

            removeRunningUpload(fileId)

            setUploadQueue((prev) =>
              prev.map((item) =>
                item.file === file ? { ...item, status: "failed" as const, error: errorMessage } : item,
              ),
            )
          }
        }

        activeUploadsRef.current.delete(uploadId)
      } catch (error) {
        activeUploadsRef.current.delete(fileInfo.multipartUpload?.id || "")

        const errorMessage = error instanceof Error ? error.message : "Multipart upload failed"

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === file ? { ...item, status: "failed" as const, error: errorMessage, progress: 0 } : item,
          ),
        )

        if (fileInfo.multipartUpload) {
          fileInfo.multipartUpload.status = "failed"
          fileInfo.multipartUpload.error = errorMessage
          saveIncompleteUpload(fileInfo.multipartUpload)
          // Remove from running uploads on error
          removeRunningUpload(fileInfo.multipartUpload.uploadId)
        }

        throw error
      }
    },
    [uploadCancelled],
  )

  const uploadFileWithProgress = useCallback((fileInfo: FileUploadInfo, token: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append("file", fileInfo.file)

      setUploadQueue((prev) => prev.map((item) => (item.file === fileInfo.file ? { ...item, xhr } : item)))

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadQueue((prev) =>
            prev.map((item) => (item.file === fileInfo.file ? { ...item, progress: percentComplete } : item)),
          )
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === fileInfo.file ? { ...item, status: "completed" as const, progress: 100 } : item,
            ),
          )
          resolve()
        } else {
          let errorMessage = "Upload failed"

          try {
            const errorData = JSON.parse(xhr.responseText)
            errorMessage = errorData.message || errorData.detail || "Upload failed"
          } catch (parseError) {
            if (xhr.status === 507) {
              errorMessage = "Insufficient storage space"
            } else if (xhr.status === 413) {
              errorMessage = "File too large"
            } else if (xhr.status === 415) {
              errorMessage = "File type not supported"
            } else {
              errorMessage = `Upload failed (HTTP ${xhr.status})`
            }
          }

          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === fileInfo.file
                ? {
                    ...item,
                    status: "failed" as const,
                    progress: 0,
                    error: errorMessage,
                  }
                : item,
            ),
          )

          if (xhr.status === 507) {
            setUploadCancelled(true)
          }

          reject(new Error(errorMessage))
        }
      })

      xhr.addEventListener("error", () => {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfo.file
              ? {
                  ...item,
                  status: "failed" as const,
                  progress: 0,
                  error: "Network error occurred",
                }
              : item,
          ),
        )
        reject(new Error("Network error"))
      })

      xhr.addEventListener("abort", () => {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfo.file
              ? {
                  ...item,
                  status: "cancelled" as const,
                  error: "Upload cancelled by user",
                }
              : item,
          ),
        )
        reject(new Error("Upload cancelled"))
      })

      xhr.open("POST", `${process.env.NEXT_PUBLIC_BINX_API_URL}/file/upload`)
      xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      xhr.send(formData)
    })
  }, [])

  const uploadFilesSequentially = useCallback(
    async (fileInfos: FileUploadInfo[], token: string) => {
      for (let i = 0; i < fileInfos.length; i++) {
        if (uploadCancelled) {
          setUploadQueue((prev) =>
            prev.map((item) => {
              const currentFileIndex = prev.findIndex((prevItem) => prevItem.file === fileInfos[i].file)
              const itemIndex = prev.findIndex((prevItem) => prevItem.file === item.file)
              return currentFileIndex >= 0 && itemIndex >= currentFileIndex
                ? { ...item, status: "cancelled" as const, error: "Upload cancelled by user" }
                : item
            }),
          )
          break
        }

        while (batchPaused && !uploadCancelled) {
          // Mark pending files as paused
          setUploadQueue((prev) =>
            prev.map((item) => {
              const itemIndex = prev.findIndex((prevItem) => prevItem.file === item.file)
              const currentIndex = prev.findIndex((prevItem) => prevItem.file === fileInfos[i].file)
              return itemIndex >= currentIndex && item.status === "pending"
                ? { ...item, status: "paused" as const }
                : item
            }),
          )
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }

        if (!batchPaused && !uploadCancelled) {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === fileInfos[i].file && item.status === "paused"
                ? { ...item, status: "pending" as const }
                : item,
            ),
          )
        }

        if (uploadCancelled) break

        setCurrentUploadIndex(i)

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfos[i].file ? { ...item, status: "uploading" as const, progress: 0 } : item,
          ),
        )

        try {
          // Check if file should use multipart upload
          if (shouldUseMultipart(fileInfos[i].file.size)) {
            await uploadFileWithMultipart(fileInfos[i], token)
          } else {
            await uploadFileWithProgress(fileInfos[i], token)
          }
        } catch (error) {
          console.error("Upload error:", error)
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.file === fileInfos[i].file
                ? {
                    ...item,
                    status: "failed" as const,
                    progress: 0,
                    error: "Network error occurred",
                  }
                : item,
            ),
          )
        }

        // Reduced delay between uploads from 500ms to 100ms
        if (!uploadCancelled && i < fileInfos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      // Check if all uploads are complete
      const allComplete = uploadQueue.every(
        (file) =>
          file.status === "completed" ||
          file.status === "failed" ||
          file.status === "cancelled" ||
          file.status === "size-exceeded",
      )

      if (allComplete) {
        // Refresh vault data immediately when uploads complete
        fetchVaultData(localStorage.getItem("token") || "")

        // Show completion state briefly, then cleanup
        setTimeout(() => {
          setIsUploading(false)
          setUploadQueue([])
          setCurrentUploadIndex(-1)
          setUploadCancelled(false)
          setShowDetailedProgress(false)
          setBatchPaused(false)
        }, 1500) // Reduced from 5000ms to 1500ms
      }
    },
    [uploadCancelled, uploadFileWithProgress, uploadFileWithMultipart, fetchVaultData, uploadQueue, batchPaused],
  )

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = event.target.files
      if (!selectedFiles || selectedFiles.length === 0) return

      const token = localStorage.getItem("token")
      if (!token) return

      const fileArray = Array.from(selectedFiles)
      const { canUpload, exceedsStorage } = checkStorageCapacity(fileArray)

      const fileInfos: FileUploadInfo[] = fileArray.map((file) => {
        const isExceeded = exceedsStorage.includes(file)
        return {
          file,
          status: isExceeded ? "size-exceeded" : "pending",
          progress: 0,
          error: isExceeded
            ? `File size exceeds available storage (${formatFileSize(vaultData!.size - vaultData!.used_storage)} remaining)`
            : undefined,
        }
      })

      setUploadQueue(fileInfos)
      setIsUploading(true)
      setUploadCancelled(false)
      setShowDetailedProgress(false)

      if (!canUpload || fileInfos.every((f) => f.status === "size-exceeded")) {
        setTimeout(() => {
          setIsUploading(false)
          setUploadQueue([])
          setCurrentUploadIndex(-1)
        }, 3000) // Reduced from 5000ms to 3000ms for size exceeded cases
        event.target.value = ""
        return
      }

      const filesToUpload = fileInfos.filter((f) => f.status === "pending")
      await uploadFilesSequentially(filesToUpload, token)

      event.target.value = ""
    },
    [checkStorageCapacity, vaultData, uploadFilesSequentially],
  )

  const cancelUpload = useCallback(() => {
    setUploadCancelled(true)
    setBatchPaused(false)

    // Cancel all active multipart uploads
    activeUploadsRef.current.forEach((controls, uploadId) => {
      try {
        controls.abort()
      } catch (error) {
        console.error(`Failed to abort upload ${uploadId}:`, error)
      }
    })
    activeUploadsRef.current.clear()

    setUploadQueue((prev) =>
      prev.map((item) => {
        if ((item.status === "pending" || item.status === "uploading") && item.xhr) {
          try {
            item.xhr.abort()
          } catch (error) {
            console.error(`Failed to abort XHR for ${item.file.name}:`, error)
          }
        }
        return item.status === "pending" || item.status === "uploading"
          ? { ...item, status: "cancelled" as const, error: "Upload cancelled by user" }
          : item
      }),
    )

    setTimeout(() => {
      setIsUploading(false)
      setUploadQueue([])
      setCurrentUploadIndex(-1)
      setUploadCancelled(false)
      setShowDetailedProgress(false)
    }, 1000)
  }, [])

  const cancelSingleUpload = useCallback((fileInfo: FileUploadInfo) => {
    if (fileInfo.multipartUpload) {
      const controls = activeUploadsRef.current.get(fileInfo.multipartUpload.id)
      if (controls) {
        try {
          controls.abort()
        } catch (error) {
          console.error(`Failed to abort multipart upload for ${fileInfo.file.name}:`, error)
        }
      }
    } else if (fileInfo.xhr) {
      try {
        fileInfo.xhr.abort()
      } catch (error) {
        console.error(`Failed to abort XHR for ${fileInfo.file.name}:`, error)
      }
    }

    setUploadQueue((prev) =>
      prev.map((item) =>
        item.file === fileInfo.file
          ? { ...item, status: "cancelled" as const, error: "Upload cancelled by user" }
          : item,
      ),
    )
  }, [])

  const pauseUpload = useCallback((uploadId?: string) => {
    if (uploadId) {
      const controls = activeUploadsRef.current.get(uploadId)
      if (controls) {
        controls.pause()
      }
    } else {
      // Pause all active multipart uploads
      activeUploadsRef.current.forEach((controls) => {
        controls.pause()
      })

      // Set batch pause to prevent new uploads from starting
      setBatchPaused(true)
    }

    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.multipartUpload && (!uploadId || item.multipartUpload.id === uploadId)) {
          return { ...item, status: "paused" as const }
        }
        // For batch pause, mark pending files as paused
        if (!uploadId && item.status === "pending") {
          return { ...item, status: "paused" as const }
        }
        return item
      }),
    )
  }, [])

  const resumeUpload = useCallback((uploadId?: string) => {
    if (uploadId) {
      const controls = activeUploadsRef.current.get(uploadId)
      if (controls) {
        controls.resume()
      }
    } else {
      // Resume all paused multipart uploads
      activeUploadsRef.current.forEach((controls) => {
        controls.resume()
      })

      // Clear batch pause to allow new uploads to start
      setBatchPaused(false)
    }

    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.status === "paused" && (!uploadId || item.multipartUpload?.id === uploadId)) {
          // If it's a multipart upload, resume to uploading, otherwise back to pending
          return {
            ...item,
            status: item.multipartUpload ? ("uploading" as const) : ("pending" as const),
          }
        }
        return item
      }),
    )
  }, [])

  const retryMultipartUpload = useCallback(
    async (incompleteUpload: MultipartUpload) => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        // Prompt user to select the file again
        const selectedFile = await promptFileSelection()

        if (!selectedFile) {
          // User cancelled file selection
          return
        }

        // Verify the selected file matches the incomplete upload
        if (!verifyFileForRetry(selectedFile, incompleteUpload)) {
          toast({
            title: "File mismatch",
            description: `Selected file doesn't match the incomplete upload.\nExpected: ${incompleteUpload.fileName} (${incompleteUpload.fileSize} bytes)\nGot: ${selectedFile.name} (${selectedFile.size} bytes)\n\nPlease select the correct file or abort this upload.`,
            variant: "destructive",
          })
          return
        }

        // Get the latest incomplete upload info from API to know which chunks are missing
        const apiUploads = await getIncompleteUploadsFromAPI(token)
        const latestUploadInfo = apiUploads.find((upload) => upload.uploadId === incompleteUpload.uploadId)

        if (!latestUploadInfo) {
          // Upload might have been completed or aborted
          removeIncompleteUpload(incompleteUpload.id)
          toast({
            title: "Upload not found",
            description: "Upload not found on server. It may have been completed or aborted.",
            variant: "destructive",
          })
          return
        }

        // Create chunks for the selected file
        const chunks = createChunks(selectedFile, incompleteUpload.chunkSize)

        // Update the incomplete upload with latest info from server
        const updatedUpload = {
          ...incompleteUpload,
          uploadedChunks: latestUploadInfo.uploadedChunks,
          status: "uploading" as const,
        }

        // Create file info for the retry
        const fileInfo: FileUploadInfo = {
          file: selectedFile,
          status: "uploading",
          progress: calculateUploadProgress(updatedUpload.uploadedChunks, updatedUpload.totalChunks),
          multipartUpload: updatedUpload,
        }

        setUploadQueue([fileInfo])
        setIsUploading(true)
        setUploadCancelled(false)
        setShowDetailedProgress(false)

        // Add to running uploads
        addRunningUpload(updatedUpload.uploadId)

        let isPaused = false
        let isAborted = false

        const uploadControls = {
          abort: () => {
            isAborted = true
            abortMultipartUpload(updatedUpload.uploadId, token).catch(console.error)
            removeIncompleteUpload(updatedUpload.id)
            removeRunningUpload(updatedUpload.uploadId)
          },
          pause: () => {
            isPaused = true
            updatedUpload.status = "paused"
            saveIncompleteUpload(updatedUpload)
          },
          resume: () => {
            isPaused = false
            updatedUpload.status = "uploading"
            saveIncompleteUpload(updatedUpload)
          },
        }

        activeUploadsRef.current.set(updatedUpload.id, uploadControls)

        // Upload only missing chunks
        for (let i = 0; i < chunks.length; i++) {
          const chunkNumber = i + 1

          // Skip already uploaded chunks
          if (updatedUpload.uploadedChunks.has(chunkNumber)) {
            continue
          }

          if (isAborted || uploadCancelled) break

          // Wait if paused
          while (isPaused && !isAborted && !uploadCancelled) {
            await new Promise((resolve) => {
              fileInfo.pauseResolve = resolve
              setTimeout(resolve, 1000)
            })
          }

          if (isAborted || uploadCancelled) break

          const chunk = chunks[i]

          try {
            await uploadChunk(updatedUpload.uploadId, chunk.chunkNumber, chunk.data, token, (loaded, total) => {
              const chunkProgress = (loaded / total) * 100
              const overallProgress = Math.round(
                ((updatedUpload.uploadedChunks.size + chunkProgress / 100) / updatedUpload.totalChunks) * 100,
              )

              setUploadQueue((prev) =>
                prev.map((item) =>
                  item.multipartUpload?.id === updatedUpload.id ? { ...item, progress: overallProgress } : item,
                ),
              )
            })

            // Mark chunk as completed
            updatedUpload.uploadedChunks.add(chunkNumber)
            updatedUpload.lastActivity = Date.now()

            // Update progress
            const progress = calculateUploadProgress(updatedUpload.uploadedChunks, updatedUpload.totalChunks)

            setUploadQueue((prev) =>
              prev.map((item) => (item.multipartUpload?.id === updatedUpload.id ? { ...item, progress } : item)),
            )

            // Save progress
            saveIncompleteUpload(updatedUpload)
          } catch (error) {
            if (isAborted || uploadCancelled) break

            updatedUpload.status = "failed"
            updatedUpload.error = error instanceof Error ? error.message : "Chunk upload failed"
            saveIncompleteUpload(updatedUpload)
            removeRunningUpload(updatedUpload.uploadId)

            setUploadQueue((prev) =>
              prev.map((item) => ({ ...item, status: "failed" as const, error: updatedUpload.error })),
            )

            throw error
          }
        }

        if (!isAborted && !uploadCancelled) {
          // Complete multipart upload
          await completeMultipartUpload(updatedUpload.uploadId, token)

          // Mark as completed and cleanup
          removeIncompleteUpload(updatedUpload.id)
          removeRunningUpload(updatedUpload.uploadId)

          setUploadQueue((prev) => prev.map((item) => ({ ...item, status: "completed" as const, progress: 100 })))

          // Refresh vault data
          fetchVaultData(token)
        }

        activeUploadsRef.current.delete(updatedUpload.id)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to retry upload"

        toast({
          title: "Retry failed",
          description: errorMessage,
          variant: "destructive",
        })

        setUploadQueue((prev) => prev.map((item) => ({ ...item, status: "failed" as const, error: errorMessage })))

        setTimeout(() => {
          setIsUploading(false)
          setUploadQueue([])
        }, 3000)
      }
    },
    [uploadCancelled, fetchVaultData],
  )

  const retryMultipartCompletion = useCallback(
    async (fileInfo: FileUploadInfo) => {
      if (!fileInfo.multipartUpload) return

      const token = localStorage.getItem("token")
      if (!token) return

      try {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfo.file ? { ...item, status: "uploading" as const, error: undefined } : item,
          ),
        )

        // Retry the completion
        await completeMultipartUpload(fileInfo.multipartUpload.uploadId, token)

        // Mark as completed and cleanup
        removeIncompleteUpload(fileInfo.multipartUpload.id)
        removeRunningUpload(fileInfo.multipartUpload.uploadId)

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfo.file
              ? { ...item, status: "completed" as const, progress: 100, error: undefined }
              : item,
          ),
        )

        // Refresh vault data
        fetchVaultData(token)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Retry failed"

        setUploadQueue((prev) =>
          prev.map((item) =>
            item.file === fileInfo.file ? { ...item, status: "failed" as const, error: errorMessage } : item,
          ),
        )
      }
    },
    [fetchVaultData],
  )

  const abortMultipartUploadHandler = useCallback(async (incompleteUpload: MultipartUpload) => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      await abortMultipartUpload(incompleteUpload.uploadId, token)
      removeIncompleteUpload(incompleteUpload.id)
    } catch (error) {
      console.error("Failed to abort multipart upload:", error)
      // Still remove from local storage even if API call fails
      removeIncompleteUpload(incompleteUpload.id)
    }
  }, [])

  const getCurrentUploadingFile = useCallback(() => {
    return uploadQueue.find((file) => file.status === "uploading" || file.status === "paused") || null
  }, [uploadQueue])

  const getUploadSummary = useCallback(() => {
    const completed = uploadQueue.filter((f) => f.status === "completed").length
    const failed = uploadQueue.filter((f) => f.status === "failed").length
    const cancelled = uploadQueue.filter((f) => f.status === "cancelled").length
    const sizeExceeded = uploadQueue.filter((f) => f.status === "size-exceeded").length
    const uploadable = uploadQueue.filter((f) => f.status !== "size-exceeded").length

    return { completed, failed, cancelled, sizeExceeded, uploadable, total: uploadQueue.length }
  }, [uploadQueue])

  return {
    uploadQueue,
    isUploading,
    showDetailedProgress,
    setShowDetailedProgress,
    handleFileUpload,
    cancelUpload,
    cancelSingleUpload, // Added individual file cancellation
    pauseUpload,
    resumeUpload,
    retryMultipartUpload,
    retryMultipartCompletion, // Added completion retry functionality
    abortMultipartUpload: abortMultipartUploadHandler,
    getCurrentUploadingFile,
    getUploadSummary,
  }
}
