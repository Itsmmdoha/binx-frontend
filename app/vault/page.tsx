"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { VaultHeader } from "@/components/vault/vault-header"
import { VaultInfo } from "@/components/vault/vault-info"
import { FilesList } from "@/components/vault/files-list"
import { UploadProgress } from "@/components/vault/upload-progress"
import { FileDialogs } from "@/components/vault/file-dialogs"
import { useVaultData } from "@/hooks/use-vault-data"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useFileOperations } from "@/hooks/use-file-operations"
import { useFileSelection } from "@/hooks/use-file-selection"
import type { UserType } from "@/types"

export default function VaultPage() {
  const router = useRouter()
  const [userType, setUserType] = useState<UserType>("owner")
  const [vaultName, setVaultName] = useState("")

  const {
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
  } = useVaultData()

  const { selectedFiles, isSelectionMode, setIsSelectionMode, toggleFileSelection, selectAllFiles, clearSelection } =
    useFileSelection(filteredAndSortedFiles)

  const {
    uploadQueue,
    isUploading,
    showDetailedProgress,
    setShowDetailedProgress,
    handleFileUpload,
    cancelUpload,
    pauseUpload,
    resumeUpload,
    retryMultipartUpload,
    abortMultipartUpload: abortMultipartUploadHandler,
    getCurrentUploadingFile,
    getUploadSummary,
  } = useFileUpload(vaultData, fetchVaultData)

  const {
    renameDialog,
    deleteDialog,
    bulkDeleteDialog,
    visibilityDialog,
    handleDownload,
    handleRename,
    handleDelete,
    handleBulkDelete,
    handleBulkDeleteConfirm,
    handleVisibilityChange,
    handleCopyPublicLink,
    setRenameDialog,
    setDeleteDialog,
    setBulkDeleteDialog,
    setVisibilityDialog,
  } = useFileOperations(fetchVaultData, clearAuthAndRedirect, clearSelection)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const type = localStorage.getItem("userType") as UserType
    const vault = localStorage.getItem("vaultName")

    if (!token || !type || !vault) {
      router.push("/login/")
      return
    }

    setUserType(type)
    setVaultName(vault)
    fetchVaultData(token)
  }, [router, fetchVaultData])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userType")
    localStorage.removeItem("vaultName")
    router.push("/")
  }

  const handleBulkDeleteAction = () => {
    const selectedFileData = filteredAndSortedFiles.filter((file) => selectedFiles.has(file.id))
    handleBulkDelete(
      Array.from(selectedFiles),
      selectedFileData.map((file) => file.file),
    )
  }

  const handleVaultRenamed = (newName: string) => {
    setVaultName(newName)
  }

  const handleVaultDeleted = () => {
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading vault...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <VaultHeader
        vaultName={vaultName}
        userType={userType}
        isSelectionMode={isSelectionMode}
        selectedFiles={selectedFiles}
        onFileUpload={handleFileUpload}
        onToggleSelection={() => setIsSelectionMode(!isSelectionMode)}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDeleteAction}
        onLogout={handleLogout}
        onVaultRenamed={handleVaultRenamed}
        onVaultDeleted={handleVaultDeleted}
        onRetryMultipartUpload={retryMultipartUpload}
        onAbortMultipartUpload={abortMultipartUploadHandler}
      />

      <div className="p-6">
        {vaultData && <VaultInfo vaultData={vaultData} files={files} />}

        <FilesList
          files={filteredAndSortedFiles}
          userType={userType}
          isSelectionMode={isSelectionMode}
          selectedFiles={selectedFiles}
          searchQuery={searchQuery}
          sortOption={sortOption}
          vaultName={vaultName}
          onSearchChange={setSearchQuery}
          onSortChange={setSortOption}
          onFileSelect={toggleFileSelection}
          onSelectAll={selectAllFiles}
          onDownload={handleDownload}
          onRename={(file) => setRenameDialog({ open: true, file, newName: file.file })}
          onDelete={(file) => setDeleteDialog({ open: true, file })}
          onVisibilityChange={(file, visibility) => setVisibilityDialog({ open: true, file, visibility })}
          onCopyPublicLink={handleCopyPublicLink}
        />
      </div>

      <UploadProgress
        isUploading={isUploading}
        uploadQueue={uploadQueue}
        showDetailedProgress={showDetailedProgress}
        currentUploadingFile={getCurrentUploadingFile()}
        uploadSummary={getUploadSummary()}
        onToggleDetailed={() => setShowDetailedProgress(!showDetailedProgress)}
        onCancel={cancelUpload}
        onPause={pauseUpload}
        onResume={resumeUpload}
      />

      <FileDialogs
        renameDialog={renameDialog}
        deleteDialog={deleteDialog}
        bulkDeleteDialog={bulkDeleteDialog}
        visibilityDialog={visibilityDialog}
        onRename={handleRename}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDeleteConfirm}
        onVisibilityChange={handleVisibilityChange}
        onRenameDialogChange={setRenameDialog}
        onDeleteDialogChange={setDeleteDialog}
        onBulkDeleteDialogChange={setBulkDeleteDialog}
        onVisibilityDialogChange={setVisibilityDialog}
      />
    </div>
  )
}
