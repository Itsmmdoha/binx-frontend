"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Settings, Edit, Key, Trash2, Loader2, AlertTriangle } from "lucide-react"

interface VaultSettingsProps {
  vaultName: string
  onVaultRenamed: (newName: string) => void
  onVaultDeleted: () => void
}

export function VaultSettings({ vaultName, onVaultRenamed, onVaultDeleted }: VaultSettingsProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [renameDialog, setRenameDialog] = useState({ open: false, newName: "", loading: false })
  const [passwordDialog, setPasswordDialog] = useState({
    open: false,
    newPassword: "",
    confirmPassword: "",
    loading: false,
  })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, loading: false })
  const [error, setError] = useState("")

  const handleRenameVault = async () => {
    if (!renameDialog.newName.trim()) return

    setRenameDialog((prev) => ({ ...prev, loading: true }))
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_name: renameDialog.newName.trim().toLowerCase() }),
      })

      if (response.ok) {
        const newName = renameDialog.newName.trim().toLowerCase()
        localStorage.setItem("vaultName", newName)
        onVaultRenamed(newName)
        setRenameDialog({ open: false, newName: "", loading: false })
        setShowSettings(false)
      } else if (response.status === 401) {
        localStorage.clear()
        window.location.href = "/login"
      } else {
        const data = await response.json()
        setError(data.detail || "Failed to rename vault")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setRenameDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleChangePassword = async () => {
    if (!passwordDialog.newPassword || passwordDialog.newPassword !== passwordDialog.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setPasswordDialog((prev) => ({ ...prev, loading: true }))
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ new_password: passwordDialog.newPassword }),
      })

      if (response.ok) {
        setPasswordDialog({ open: false, newPassword: "", confirmPassword: "", loading: false })
        setShowSettings(false)
        // Show success message or redirect to login
        alert("Password changed successfully. Please log in again.")
        localStorage.clear()
        window.location.href = "/login"
      } else if (response.status === 401) {
        localStorage.clear()
        window.location.href = "/login"
      } else {
        const data = await response.json()
        setError(data.detail || "Failed to change password")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setPasswordDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteVault = async () => {
    setDeleteDialog((prev) => ({ ...prev, loading: true }))
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_BINX_API_URL}/vault`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        localStorage.clear()
        onVaultDeleted()
      } else if (response.status === 401) {
        localStorage.clear()
        window.location.href = "/login"
      } else {
        const data = await response.json()
        setError(data.detail || "Failed to delete vault")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setDeleteDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSettings(true)}
        className="hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Settings className="w-4 h-4" />
      </Button>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Vault Settings</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Manage your vault settings and preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="dark:bg-gray-900 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm dark:text-gray-100">Vault Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start dark:border-gray-600 dark:text-gray-300 bg-transparent"
                  onClick={() => {
                    setRenameDialog({ open: true, newName: vaultName, loading: false })
                    setShowSettings(false)
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Rename Vault
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start dark:border-gray-600 dark:text-gray-300 bg-transparent"
                  onClick={() => {
                    setPasswordDialog({ open: true, newPassword: "", confirmPassword: "", loading: false })
                    setShowSettings(false)
                  }}
                >
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>

                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => {
                    setDeleteDialog({ open: true, loading: false })
                    setShowSettings(false)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Vault
                </Button>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Vault Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Rename Vault</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Enter a new name for your vault "{vaultName}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newVaultName" className="dark:text-gray-100">
                New Vault Name
              </Label>
              <Input
                id="newVaultName"
                value={renameDialog.newName}
                onChange={(e) => setRenameDialog((prev) => ({ ...prev, newName: e.target.value }))}
                placeholder="Enter new vault name"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                disabled={renameDialog.loading}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500">Vault name will be converted to lowercase</p>
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialog({ open: false, newName: "", loading: false })}
              disabled={renameDialog.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameVault}
              disabled={renameDialog.loading || !renameDialog.newName.trim()}
              className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
            >
              {renameDialog.loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Renaming...
                </>
              ) : (
                "Rename Vault"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialog.open} onOpenChange={(open) => setPasswordDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Change Password</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Set a new password for your vault. You'll need to log in again after changing it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="dark:text-gray-100">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordDialog.newPassword}
                onChange={(e) => setPasswordDialog((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Enter new password"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                disabled={passwordDialog.loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="dark:text-gray-100">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordDialog.confirmPassword}
                onChange={(e) => setPasswordDialog((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm new password"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                disabled={passwordDialog.loading}
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPasswordDialog({ open: false, newPassword: "", confirmPassword: "", loading: false })}
              disabled={passwordDialog.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={
                passwordDialog.loading ||
                !passwordDialog.newPassword ||
                passwordDialog.newPassword !== passwordDialog.confirmPassword
              }
              className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
            >
              {passwordDialog.loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vault Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-gray-100 flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              Delete Vault
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone. This will permanently delete your vault "{vaultName}" and all files stored
              in it.
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">
                  ⚠️ All files will be permanently lost
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDialog.loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVault}
              disabled={deleteDialog.loading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {deleteDialog.loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Vault"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
