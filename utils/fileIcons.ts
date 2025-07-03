import {
  FileText,
  ImageIcon,
  Video,
  Music,
  Archive,
  File,
  FileSpreadsheet,
  FileCode,
  FileIcon as FilePdf,
  type LucideIcon,
} from "lucide-react"

export const getFileIcon = (fileName: string): LucideIcon => {
  const extension = fileName.split(".").pop()?.toLowerCase()

  const iconMap: Record<string, LucideIcon> = {
    // Documents
    pdf: FilePdf,
    doc: FileText,
    docx: FileText,
    txt: FileText,
    rtf: FileText,

    // Spreadsheets
    xls: FileSpreadsheet,
    xlsx: FileSpreadsheet,
    csv: FileSpreadsheet,

    // Images
    jpg: ImageIcon,
    jpeg: ImageIcon,
    png: ImageIcon,
    gif: ImageIcon,
    bmp: ImageIcon,
    svg: ImageIcon,
    webp: ImageIcon,

    // Videos
    mp4: Video,
    avi: Video,
    mov: Video,
    wmv: Video,
    flv: Video,
    webm: Video,
    mkv: Video,

    // Audio
    mp3: Music,
    wav: Music,
    flac: Music,
    aac: Music,
    ogg: Music,
    wma: Music,

    // Archives
    zip: Archive,
    rar: Archive,
    "7z": Archive,
    tar: Archive,
    gz: Archive,

    // Code
    js: FileCode,
    jsx: FileCode,
    ts: FileCode,
    tsx: FileCode,
    html: FileCode,
    css: FileCode,
    py: FileCode,
    java: FileCode,
    cpp: FileCode,
    c: FileCode,
    php: FileCode,
    rb: FileCode,
    go: FileCode,
    rs: FileCode,
    json: FileCode,
    xml: FileCode,
    yaml: FileCode,
    yml: FileCode,
  }

  return iconMap[extension || ""] || File
}

export const getFileIconColor = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase()

  const colorMap: Record<string, string> = {
    // Documents - Blue
    pdf: "text-red-500",
    doc: "text-blue-500",
    docx: "text-blue-500",
    txt: "text-gray-500",

    // Spreadsheets - Green
    xls: "text-green-500",
    xlsx: "text-green-500",
    csv: "text-green-500",

    // Images - Purple
    jpg: "text-purple-500",
    jpeg: "text-purple-500",
    png: "text-purple-500",
    gif: "text-purple-500",
    svg: "text-purple-500",
    webp: "text-purple-500",

    // Videos - Red
    mp4: "text-red-500",
    avi: "text-red-500",
    mov: "text-red-500",
    webm: "text-red-500",

    // Audio - Orange
    mp3: "text-orange-500",
    wav: "text-orange-500",
    flac: "text-orange-500",

    // Archives - Yellow
    zip: "text-yellow-500",
    rar: "text-yellow-500",
    "7z": "text-yellow-500",

    // Code - Indigo
    js: "text-indigo-500",
    jsx: "text-indigo-500",
    ts: "text-indigo-500",
    tsx: "text-indigo-500",
    html: "text-indigo-500",
    css: "text-indigo-500",
    py: "text-indigo-500",
    json: "text-indigo-500",
  }

  return colorMap[extension || ""] || "text-gray-500"
}
