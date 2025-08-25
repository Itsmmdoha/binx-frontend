"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  FileText,
  HardDrive,
  CheckSquare,
  Square,
  FolderOpen,
  Download,
  MoreVertical,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  Link,
} from "lucide-react"
import { getFileIcon, getFileIconColor } from "@/utils/fileIcons"
import { formatFileSize, formatDate } from "@/utils"
import type { FileData, UserType } from "@/types"

type SortOption = "name-asc" | "name-desc" | "date-asc" | "date-desc" | "size-asc" | "size-desc"

interface FilesListProps {
  files: FileData[]
  userType: UserType
  isSelectionMode: boolean
  selectedFiles: Set<string>
  searchQuery: string
  sortOption: SortOption
  vaultName: string
  onSearchChange: (query: string) => void
  onSortChange: (option: SortOption) => void
  onFileSelect: (fileId: string) => void
  onSelectAll: () => void
  onDownload: (fileId: string, fileName: string) => void
  onRename: (file: FileData) => void
  onDelete: (file: FileData) => void
  onVisibilityChange: (file: FileData, visibility: string) => void
  onCopyPublicLink: (file: FileData, vaultName: string) => void
}

export function FilesList({
  files,
  userType,
  isSelectionMode,
  selectedFiles,
  searchQuery,
  sortOption,
  vaultName,
  onSearchChange,
  onSortChange,
  onFileSelect,
  onSelectAll,
  onDownload,
  onRename,
  onDelete,
  onVisibilityChange,
  onCopyPublicLink,
}: FilesListProps) {
  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case "name-asc":
        return "Name A-Z"
      case "name-desc":
        return "Name Z-A"
      case "date-asc":
        return "Date (Oldest)"
      case "date-desc":
        return "Date (Newest)"
      case "size-asc":
        return "Size (Smallest)"
      case "size-desc":
        return "Size (Largest)"
      default:
        return "Date (Newest)"
    }
  }

  const getSortIcon = (option: SortOption) => {
    switch (option) {
      case "name-asc":
      case "name-desc":
        return <FileText className="w-4 h-4" />
      case "date-asc":
      case "date-desc":
        return <Calendar className="w-4 h-4" />
      case "size-asc":
      case "size-desc":
        return <HardDrive className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle className="text-gray-900 dark:text-gray-100">Files</CardTitle>
            {isSelectionMode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                {selectedFiles.size === files.length && files.length > 0 ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Select All ({files.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 w-full sm:w-64 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 placeholder:text-gray-500"
              />
            </div>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
                >
                  {getSortIcon(sortOption)}
                  <span className="hidden sm:inline">{getSortLabel(sortOption)}</span>
                  <span className="sm:hidden">Sort</span>
                  {sortOption.includes("asc") ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 dark:bg-gray-800 dark:border-gray-700">
                <DropdownMenuItem
                  onClick={() => onSortChange("name-asc")}
                  className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Name A-Z
                  <SortAsc className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSortChange("name-desc")}
                  className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Name Z-A
                  <SortDesc className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSortChange("date-desc")}
                  className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Date (Newest)
                  <SortDesc className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSortChange("date-asc")}
                  className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Date (Oldest)
                  <SortAsc className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSortChange("size-desc")}
                  className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <HardDrive className="w-4 h-4 mr-2" />
                  Size (Largest)
                  <SortDesc className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onSortChange("size-asc")}
                  className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <HardDrive className="w-4 h-4 mr-2" />
                  Size (Smallest)
                  <SortAsc className="w-4 h-4 ml-auto" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            {searchQuery ? (
              <div>
                <p className="text-gray-600 dark:text-gray-400">No files found matching "{searchQuery}"</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Try adjusting your search terms</p>
              </div>
            ) : (
              <div>
                <p className="text-gray-600 dark:text-gray-400">No files in this vault yet</p>
                {userType === "owner" && (
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Upload your first file to get started</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.file)
              const iconColor = getFileIconColor(file.file)

              return (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {isSelectionMode && userType === "owner" && (
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => onFileSelect(file.id)}
                        className="flex-shrink-0"
                      />
                    )}
                    <div className="flex-shrink-0">
                      <FileIcon className={`w-8 h-8 ${iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-lg truncate">{file.file}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 text-sm text-gray-500 dark:text-gray-500 mt-1 space-y-1 sm:space-y-0">
                        <span className="font-medium">{formatFileSize(file.size)}</span>
                        <span className="hidden sm:inline">{formatDate(file.date_created)}</span>
                        <div className="flex items-center space-x-1">
                          {file.visibility === "public" ? (
                            <>
                              <Eye className="w-4 h-4 text-red-500" />
                              <span className="text-red-600 dark:text-red-400 font-medium">Public</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                              <span className="text-gray-600 dark:text-gray-400">Private</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload(file.id, file.file)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    {userType === "owner" && !isSelectionMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 dark:bg-gray-800 dark:border-gray-700">
                          <DropdownMenuItem
                            onClick={() => onRename(file)}
                            className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onVisibilityChange(file, file.visibility === "public" ? "private" : "public")
                            }
                            className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            {file.visibility === "public" ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Make Private
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                Make Public
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onCopyPublicLink(file, vaultName)}
                            className="cursor-pointer dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <Link className="w-4 h-4 mr-2" />
                            Copy Public Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(file)}
                            className="text-red-600 dark:text-red-400 cursor-pointer focus:text-red-600 dark:focus:text-red-400 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
