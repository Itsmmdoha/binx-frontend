"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { FileData } from "@/types"

interface DialogState {
  open: boolean
  file: FileData | null
}

interface RenameDialogState extends DialogState {
  newName: string
}

interface VisibilityDialogState extends DialogState {
  visibility: string
}

interface BulkDeleteDialogState {
  open: boolean
  fileIds: string[]
  fileNames: string[]
}

interface FileDialogsProps {
  renameDialog: RenameDialogState
  deleteDialog: DialogState
  bulkDeleteDialog: BulkDeleteDialogState
  visibilityDialog: VisibilityDialogState
  onRename: () => void
  onDelete: () => void
  onBulkDelete: () => void
  onVisibilityChange: () => void
  onRenameDialogChange: (dialog: RenameDialogState) => void
  onDeleteDialogChange: (dialog: DialogState) => void
  onBulkDeleteDialogChange: (dialog: BulkDeleteDialogState) => void
  onVisibilityDialogChange: (dialog: VisibilityDialogState) => void
}

export function FileDialogs({
  renameDialog,
  deleteDialog,
  bulkDeleteDialog,
  visibilityDialog,
  onRename,
  onDelete,
  onBulkDelete,
  onVisibilityChange,
  onRenameDialogChange,
  onDeleteDialogChange,
  onBulkDeleteDialogChange,
  onVisibilityDialogChange,
}: FileDialogsProps) {
  return (
    <>
      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => onRenameDialogChange({ ...renameDialog, open })}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Rename File</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Enter a new name for "{renameDialog.file?.file}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newName" className="dark:text-gray-100">
                New Name
              </Label>
              <Input
                id="newName"
                value={renameDialog.newName}
                onChange={(e) => onRenameDialogChange({ ...renameDialog, newName: e.target.value })}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onRenameDialogChange({ open: false, file: null, newName: "" })}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button onClick={onRename} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => onDeleteDialogChange({ ...deleteDialog, open })}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Delete File</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure you want to delete "{deleteDialog.file?.file}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onDeleteDialogChange({ open: false, file: null })}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialog.open}
        onOpenChange={(open) => onBulkDeleteDialogChange({ ...bulkDeleteDialog, open })}
      >
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Delete Multiple Files</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Are you sure you want to delete {bulkDeleteDialog.fileIds.length} file
              {bulkDeleteDialog.fileIds.length !== 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-32 overflow-y-auto">
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {bulkDeleteDialog.fileNames.map((name, index) => (
                <li key={index} className="truncate">
                  • {name}
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onBulkDeleteDialogChange({ open: false, fileIds: [], fileNames: [] })}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onBulkDelete}>
              Delete {bulkDeleteDialog.fileIds.length} File{bulkDeleteDialog.fileIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visibility Dialog */}
      <Dialog
        open={visibilityDialog.open}
        onOpenChange={(open) => onVisibilityDialogChange({ ...visibilityDialog, open })}
      >
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Change Visibility</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Change "{visibilityDialog.file?.file}" visibility to {visibilityDialog.visibility}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onVisibilityDialogChange({ open: false, file: null, visibility: "" })}
              className="dark:border-gray-600 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button onClick={onVisibilityChange} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
              Change to {visibilityDialog.visibility}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
