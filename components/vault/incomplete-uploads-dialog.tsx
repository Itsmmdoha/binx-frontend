"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Pause, 
  Play, 
  X, 
  Clock, 
  FileText,
  AlertCircle,
  Trash2
} from "lucide-react"
import { getIncompleteUploads, getIncompleteUploadsFromAPI, removeIncompleteUpload, formatUploadTime, calculateUploadProgress } from "@/utils/multipart-upload"
import { formatFileSize } from "@/utils"
import type { MultipartUpload } from "@/types"

interface IncompleteUploadsDialogProps {
  onRetryUpload: (upload: MultipartUpload) => void
  onAbortUpload: (upload: MultipartUpload) => void
}

export function IncompleteUploadsDialog({ 
  onRetryUpload, 
  onAbortUpload 
}: IncompleteUploadsDialogProps) {
  const [open, setOpen] = useState(false)
  const [uploads, setUploads] = useState<MultipartUpload[]>([])

  const loadUploads = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setUploads([])
        return
      }
      
      // Try to get incomplete uploads from API first
      const apiUploads = await getIncompleteUploadsFromAPI(token)
      
      // Also get local uploads for any uploads that haven't been synced yet
      const localUploads = getIncompleteUploads()
      
      // Merge uploads, preferring API data but including local uploads not in API
      const mergedUploads = [...apiUploads]
      
      localUploads.forEach(localUpload => {
        if (!apiUploads.find(apiUpload => apiUpload.uploadId === localUpload.uploadId)) {
          mergedUploads.push(localUpload)
        }
      })
      
      setUploads(mergedUploads)
    } catch (error) {
      console.error("Failed to load incomplete uploads from API:", error)
      // Fallback to local storage if API fails
      setUploads(getIncompleteUploads())
    }
  }

  useEffect(() => {
    if (open) {
      loadUploads()
    }
  }, [open])

  const handleAbort = (upload: MultipartUpload) => {
    onAbortUpload(upload)
    removeIncompleteUpload(upload.id)
    loadUploads()
  }

  const handleRetry = (upload: MultipartUpload) => {
    setOpen(false)
    onRetryUpload(upload)
  }

  const getStatusIcon = (status: MultipartUpload['status']) => {
    switch (status) {
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'pending':
      case 'uploading':
        return <Upload className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: MultipartUpload['status']) => {
    switch (status) {
      case 'paused':
        return 'Paused'
      case 'failed':
        return 'Failed'
      case 'pending':
        return 'Pending'
      case 'uploading':
        return 'Uploading'
      default:
        return 'Unknown'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Clock className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Incomplete Uploads</span>
          <span className="sm:hidden">Uploads</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Incomplete Uploads</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {uploads.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No incomplete uploads found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {uploads.map((upload) => {
                const progress = calculateUploadProgress(upload.uploadedChunks, upload.totalChunks)
                
                return (
                  <div
                    key={upload.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                            {upload.fileName}
                          </h4>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(upload.status)}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getStatusText(upload.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>{formatFileSize(upload.fileSize)}</span>
                            <span>
                              {upload.uploadedChunks.size} of {upload.totalChunks} chunks
                            </span>
                          </div>
                          
                          <Progress value={progress} className="h-2" />
                          
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{progress}% completed</span>
                            <span>{formatUploadTime(upload.lastActivity)}</span>
                          </div>
                          
                          {upload.error && (
                            <p className="text-xs text-red-600 dark:text-red-400 break-words">
                              {upload.error}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(upload)}
                            className="text-xs"
                            disabled={upload.status === 'uploading'}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Retry
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbort(upload)}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Abort
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}