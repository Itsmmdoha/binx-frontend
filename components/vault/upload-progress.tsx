"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, ChevronUp, ChevronDown, Check, Pause, Play, RotateCcw } from "lucide-react"
import { getFileIcon, getFileIconColor } from "@/utils/fileIcons"

interface FileUploadInfo {
  file: File
  status: "pending" | "uploading" | "completed" | "failed" | "cancelled" | "size-exceeded" | "paused"
  progress: number
  error?: string
  xhr?: XMLHttpRequest
  multipartUpload?: any
  pauseResolve?: () => void
}

interface UploadSummary {
  completed: number
  failed: number
  cancelled: number
  sizeExceeded: number
  uploadable: number
  total: number
}

interface UploadProgressProps {
  isUploading: boolean
  uploadQueue: FileUploadInfo[]
  showDetailedProgress: boolean
  currentUploadingFile: FileUploadInfo | null
  uploadSummary: UploadSummary
  onToggleDetailed: () => void
  onCancel: () => void
  onCancelFile?: (fileInfo: FileUploadInfo) => void
  onPause?: (uploadId?: string) => void
  onResume?: (uploadId?: string) => void
  onRetryMultipart?: (fileInfo: FileUploadInfo) => void
}

export function UploadProgress({
  isUploading,
  uploadQueue,
  showDetailedProgress,
  currentUploadingFile,
  uploadSummary,
  onToggleDetailed,
  onCancel,
  onCancelFile,
  onPause,
  onResume,
  onRetryMultipart,
}: UploadProgressProps) {
  if (!isUploading || uploadQueue.length === 0) {
    return null
  }

  // Check if all uploads are complete
  const allUploadsComplete = uploadQueue.every(
    (file) =>
      file.status === "completed" ||
      file.status === "failed" ||
      file.status === "cancelled" ||
      file.status === "size-exceeded",
  )

  // Check if there are any paused uploads
  const hasPausedUploads = uploadQueue.some((file) => file.status === "paused")
  const hasActiveUploads = uploadQueue.some((file) => file.status === "uploading")

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50 animate-in slide-in-from-bottom-4 duration-300">
      {!showDetailedProgress ? (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Upload Progress</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDetailed}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current uploading file */}
          {currentUploadingFile && (
            <div className="flex items-center space-x-3">
              {(() => {
                const FileIcon = getFileIcon(currentUploadingFile.file.name)
                const iconColor = getFileIconColor(currentUploadingFile.file.name)
                return <FileIcon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
              })()}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                    {currentUploadingFile.file.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {currentUploadingFile.progress}%
                  </span>
                </div>
                <Progress value={currentUploadingFile.progress} className="h-2" />
              </div>
            </div>
          )}

          {/* Summary and controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {uploadSummary.completed} completed, {uploadSummary.failed} failed
            </span>
            <div className="flex items-center space-x-2">
              {(hasActiveUploads || hasPausedUploads) && (
                <>
                  {hasActiveUploads && onPause && (
                    <Button variant="outline" size="sm" onClick={() => onPause()} className="h-8 px-3 text-xs">
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </Button>
                  )}
                  {hasPausedUploads && onResume && (
                    <Button variant="outline" size="sm" onClick={() => onResume()} className="h-8 px-3 text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Resume
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Upload Progress</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDetailed}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div
            className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style jsx>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {uploadQueue.map((fileInfo, index) => {
              const FileIcon = getFileIcon(fileInfo.file.name)
              const iconColor = getFileIconColor(fileInfo.file.name)

              return (
                <div key={index} className="flex items-center space-x-3 py-2">
                  <FileIcon className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                        {fileInfo.file.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        {fileInfo.status === "completed" && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                        {fileInfo.status === "failed" && (
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-red-600">failed</span>
                            {fileInfo.multipartUpload && onRetryMultipart && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRetryMultipart(fileInfo)}
                                className="h-5 w-5 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        )}
                        {fileInfo.status === "uploading" && (
                          <span className="text-xs text-blue-600 flex-shrink-0">{fileInfo.progress}%</span>
                        )}
                        {fileInfo.status === "paused" && <Pause className="w-4 h-4 text-yellow-600 flex-shrink-0" />}
                        {(fileInfo.status === "uploading" ||
                          fileInfo.status === "paused" ||
                          fileInfo.status === "pending") &&
                          onCancelFile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCancelFile(fileInfo)}
                              className="h-5 w-5 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                      </div>
                    </div>
                    {(fileInfo.status === "uploading" || fileInfo.status === "paused") && (
                      <Progress value={fileInfo.progress} className="h-1" />
                    )}
                    {fileInfo.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 break-words">{fileInfo.error}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-2 border-t dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {uploadSummary.completed} completed, {uploadSummary.failed} failed
              </span>
              <div className="flex items-center space-x-2">
                {hasActiveUploads && onPause && (
                  <Button variant="outline" size="sm" onClick={() => onPause()} className="h-8 px-3 text-xs">
                    <Pause className="w-3 h-3 mr-1" />
                    Pause
                  </Button>
                )}
                {hasPausedUploads && onResume && (
                  <Button variant="outline" size="sm" onClick={() => onResume()} className="h-8 px-3 text-xs">
                    <Play className="w-3 h-3 mr-1" />
                    Resume
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
