"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, ChevronUp, ChevronDown, Check, AlertCircle, XCircle, AlertTriangle } from "lucide-react"
import { getFileIcon, getFileIconColor } from "@/utils/fileIcons"

interface FileUploadInfo {
  file: File
  status: "pending" | "uploading" | "completed" | "failed" | "cancelled" | "size-exceeded"
  progress: number
  error?: string
  xhr?: XMLHttpRequest
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
}

export function UploadProgress({
  isUploading,
  uploadQueue,
  showDetailedProgress,
  currentUploadingFile,
  uploadSummary,
  onToggleDetailed,
  onCancel,
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

  // Check if there are any successful uploads
  const hasCompletedUploads = uploadQueue.some((file) => file.status === "completed")

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-6 sm:w-80 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border dark:border-gray-700 z-50 animate-in slide-in-from-bottom-4 duration-300">
      {!showDetailedProgress ? (
        // Simple View - Current uploading file or completion status
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {allUploadsComplete ? "Upload Complete" : "Uploading Files"}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDetailed}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Current uploading file or completion status */}
          {currentUploadingFile ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {(() => {
                  const FileIcon = getFileIcon(currentUploadingFile.file.name)
                  const iconColor = getFileIconColor(currentUploadingFile.file.name)
                  return <FileIcon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
                })()}
                <span
                  className="text-sm truncate flex-1 text-gray-900 dark:text-gray-100"
                  title={currentUploadingFile.file.name}
                >
                  {currentUploadingFile.file.name}
                </span>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
              </div>
              <Progress value={currentUploadingFile.progress} className="h-2 transition-all duration-150" />
            </div>
          ) : allUploadsComplete && hasCompletedUploads ? (
            // Show completion status
            <div className="text-center py-2">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {uploadSummary.completed} file{uploadSummary.completed !== 1 ? "s" : ""} uploaded successfully
              </p>
              {uploadSummary.failed > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{uploadSummary.failed} failed</p>
              )}
            </div>
          ) : (
            // Show processing state only when there are pending uploads
            <div className="text-center py-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Preparing upload...</p>
            </div>
          )}

          {/* Summary */}
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 pt-2 border-t dark:border-gray-700">
            <span>
              {uploadSummary.completed} of {uploadSummary.uploadable} completed
            </span>
            <span>{uploadSummary.total} total files</span>
          </div>
        </div>
      ) : (
        // Detailed View - All files with scrolling
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
              {allUploadsComplete ? "Upload Complete" : "Upload Progress"}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleDetailed}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable file list */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {uploadQueue.map((fileInfo, index) => {
              const FileIcon = getFileIcon(fileInfo.file.name)
              const iconColor = getFileIconColor(fileInfo.file.name)

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <FileIcon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
                    <span
                      className="text-xs truncate flex-1 text-gray-900 dark:text-gray-100"
                      title={fileInfo.file.name}
                    >
                      {fileInfo.file.name}
                    </span>
                    <div className="flex-shrink-0">
                      {fileInfo.status === "completed" && <Check className="w-3 h-3 text-green-600" />}
                      {fileInfo.status === "failed" && <AlertCircle className="w-3 h-3 text-red-600" />}
                      {fileInfo.status === "cancelled" && <XCircle className="w-3 h-3 text-gray-500" />}
                      {fileInfo.status === "size-exceeded" && <AlertTriangle className="w-3 h-3 text-orange-600" />}
                      {fileInfo.status === "uploading" && (
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {fileInfo.status === "pending" && (
                        <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  {fileInfo.status === "uploading" && (
                    <Progress value={fileInfo.progress} className="h-1 transition-all duration-150" />
                  )}

                  {(fileInfo.status === "failed" ||
                    fileInfo.status === "cancelled" ||
                    fileInfo.status === "size-exceeded") &&
                    fileInfo.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 break-words pl-6">{fileInfo.error}</p>
                    )}
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="pt-2 border-t dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>
                {uploadSummary.completed} completed, {uploadSummary.failed} failed
              </span>
            </div>
            {uploadSummary.sizeExceeded > 0 && (
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {uploadSummary.sizeExceeded} file(s) exceed storage capacity
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
