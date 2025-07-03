"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatFileSize, formatDateShort } from "@/utils"
import type { VaultData, FileData } from "@/types"

interface VaultInfoProps {
  vaultData: VaultData
  files: FileData[]
}

export function VaultInfo({ vaultData, files }: VaultInfoProps) {
  const getStorageUsagePercentage = (): number => {
    return (vaultData.used_storage / vaultData.size) * 100
  }

  return (
    <div className="mb-8">
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Total Files */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <div className="w-full h-full rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">{files.length}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">Files</div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Total Files</p>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - getStorageUsagePercentage() / 100)}`}
                    className={`transition-all duration-500 ${getStorageUsagePercentage() > 90 ? "text-red-500" : "text-green-500"}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={`text-xs sm:text-sm font-bold ${getStorageUsagePercentage() > 90 ? "text-red-600" : "text-green-600"}`}
                  >
                    {Math.round(getStorageUsagePercentage())}%
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-sm sm:text-base font-semibold ${getStorageUsagePercentage() > 90 ? "text-red-600" : "text-green-600"}`}
                >
                  {formatFileSize(vaultData.used_storage)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">of {formatFileSize(vaultData.size)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Storage Used</p>
              </div>
            </div>

            {/* Date Created */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2">
                <div className="w-full h-full rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-bold text-purple-600 dark:text-purple-400 leading-tight">
                      {formatDateShort(vaultData.date_created)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm sm:text-base font-semibold text-purple-600 dark:text-purple-400">Created</div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Date Created</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
