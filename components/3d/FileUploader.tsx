"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileUp, X, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { validateSTLFile, formatFileSize } from "@/lib/firebase/storage"

interface FileUploaderProps {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  selectedFile?: File | null
  accept?: Record<string, string[]>
  maxSize?: number
  disabled?: boolean
}

export default function FileUploader({
  onFileSelect,
  onFileRemove,
  selectedFile,
  accept = { "model/stl": [".stl"], "model/obj": [".obj"] },
  maxSize = 100 * 1024 * 1024,
  disabled = false,
}: FileUploaderProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)
    
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    const validation = validateSTLFile(file)

    if (!validation.valid) {
      setError(validation.error || "Geçersiz dosya")
      return
    }

    onFileSelect(file)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
  })

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setError(null)
    onFileRemove?.()
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
          ${isDragActive 
            ? "border-primary bg-primary/5" 
            : selectedFile 
              ? "border-green-500 bg-green-500/5" 
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${error ? "border-destructive bg-destructive/5" : ""}
        `}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRemove}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              {isDragActive ? (
                <FileUp className="h-8 w-8 text-primary animate-bounce" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            <p className="text-lg font-medium text-foreground mb-1">
              {isDragActive ? "Dosyayı bırakın" : "STL dosyanızı sürükleyin"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              veya dosya seçmek için tıklayın
            </p>
            <p className="text-xs text-muted-foreground">
              Desteklenen formatlar: STL, OBJ (Maks. 100MB)
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}

