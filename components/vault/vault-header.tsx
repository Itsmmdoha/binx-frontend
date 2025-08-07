"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { VaultSettings } from "./vault-settings"
import { IncompleteUploadsDialog } from "./incomplete-uploads-dialog"
import { FolderOpen, Upload, LogOut, Crown, Users, CheckSquare, X } from "lucide-react"
import type { UserType, MultipartUpload } from "@/types"

interface VaultHeaderProps {
  vaultName: string
  userType: UserType
  isSelectionMode: boolean
  selectedFiles: Set<string>
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onToggleSelection: () => void
  onClearSelection: () => void
  onBulkDelete: () => void
  onLogout: () => void
  onVaultRenamed?: (newName: string) => void
  onVaultDeleted?: () => void
  onRetryMultipartUpload?: (upload: MultipartUpload) => void
  onAbortMultipartUpload?: (upload: MultipartUpload) => void
}

export function VaultHeader({
  vaultName,
  userType,
  isSelectionMode,
  selectedFiles,
  onFileUpload,
  onToggleSelection,
  onClearSelection,
  onBulkDelete,
  onLogout,
  onVaultRenamed,
  onVaultDeleted,
  onRetryMultipartUpload,
  onAbortMultipartUpload,
}: VaultHeaderProps) {
  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 min-w-0">
              <FolderOpen className="w-6 h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <h1 className="text-xl font-semibold truncate text-gray-900 dark:text-gray-100">{vaultName}</h1>
              {userType === "owner" && onVaultRenamed && onVaultDeleted && (
                <VaultSettings vaultName={vaultName} onVaultRenamed={onVaultRenamed} onVaultDeleted={onVaultDeleted} />
              )}
            </div>
            <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm flex-shrink-0">
              {userType === "owner" ? (
                <>
                  <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-gray-700 dark:text-gray-300">Owner</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">Guest</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            {userType === "owner" && (
              <>
                <IncompleteUploadsDialog 
                  onRetryUpload={onRetryMultipartUpload || (() => {})}
                  onAbortUpload={onAbortMultipartUpload || (() => {})}
                />
                <Button
                  onClick={() => document.getElementById("file-input")?.click()}
                  className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 flex-1 sm:flex-none"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline sm:inline">Upload Files</span>
                  <span className="xs:hidden sm:hidden">Upload</span>
                </Button>
                {!isSelectionMode ? (
                  <Button
                    variant="outline"
                    onClick={onToggleSelection}
                    className="flex-shrink-0 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Select</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={onClearSelection}
                    className="flex-shrink-0 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
                  >
                    <X className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Cancel</span>
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex-shrink-0 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Bulk actions bar */}
        {isSelectionMode && selectedFiles.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {selectedFiles.size} file{selectedFiles.size !== 1 ? "s" : ""} selected
              </span>
              <Button variant="destructive" size="sm" onClick={onBulkDelete} className="text-sm">
                <X className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hidden file input */}
      <input id="file-input" type="file" multiple onChange={onFileUpload} className="hidden" />
    </>
  )
}
