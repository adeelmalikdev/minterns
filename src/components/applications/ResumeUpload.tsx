import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResumeUpload } from "@/hooks/useResumeUpload";

interface ResumeUploadProps {
  onUploadComplete: (filePath: string) => void;
  onRemove: () => void;
  currentResume?: string | null;
}

export function ResumeUpload({ onUploadComplete, onRemove, currentResume }: ResumeUploadProps) {
  const { uploadResume, isUploading, error, clearError } = useResumeUpload();
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    clearError();
    const filePath = await uploadResume(file);
    
    if (filePath) {
      setFileName(file.name);
      onUploadComplete(filePath);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setFileName(null);
    onRemove();
  };

  const displayName = fileName || (currentResume ? "Resume uploaded" : null);

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {displayName ? (
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
          <FileText className="h-5 w-5 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground truncate flex-1">{displayName}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload Resume (PDF)
            </>
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        PDF only, max 5MB
      </p>
    </div>
  );
}
