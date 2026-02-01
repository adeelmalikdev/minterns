import { useState, useRef, useCallback } from "react";
import { Camera, Loader2, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Magic bytes for allowed image types
const FILE_SIGNATURES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
  "image/gif": [0x47, 0x49, 0x46],
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 1024;
const MIN_DIMENSION = 100;

interface AvatarUploadProps {
  currentUrl?: string | null;
  onUpload?: (url: string) => void;
  size?: "sm" | "md" | "lg";
}

export function AvatarUpload({ currentUrl, onUpload, size = "lg" }: AvatarUploadProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const validateFileSignature = async (file: File): Promise<boolean> => {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    for (const [, signature] of Object.entries(FILE_SIGNATURES)) {
      const matches = signature.every((byte, index) => bytes[index] === byte);
      if (matches) return true;
    }

    // Special check for WebP (RIFF + WEBP)
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return true;
    }

    return false;
  };

  const validateImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const valid =
          img.width >= MIN_DIMENSION &&
          img.height >= MIN_DIMENSION &&
          img.width <= MAX_DIMENSION &&
          img.height <= MAX_DIMENSION;
        resolve(valid);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user?.id) return;

      // Reset input
      event.target.value = "";

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select an image under 2MB.",
        });
        return;
      }

      // Validate file signature (magic bytes)
      const validSignature = await validateFileSignature(file);
      if (!validSignature) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a valid image file (JPEG, PNG, WebP, or GIF).",
        });
        return;
      }

      // Validate dimensions
      const validDimensions = await validateImageDimensions(file);
      if (!validDimensions) {
        toast({
          variant: "destructive",
          title: "Invalid dimensions",
          description: `Image must be between ${MIN_DIMENSION}x${MIN_DIMENSION} and ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.`,
        });
        return;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);

      // Upload to Supabase Storage
      setIsUploading(true);
      try {
        const timestamp = Date.now();
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${user.id}/avatar_${timestamp}.${fileExt}`;

        // Delete old avatar if exists
        if (currentUrl) {
          const oldPath = currentUrl.split("/avatars/").pop();
          if (oldPath) {
            await supabase.storage.from("avatars").remove([oldPath]);
          }
        }

        // Upload new avatar
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Update profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        onUpload?.(publicUrl);
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully.",
        });
      } catch (error) {
        console.error("Avatar upload error:", error);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "Failed to upload avatar. Please try again.",
        });
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [user?.id, currentUrl, onUpload, toast]
  );

  const handleRemoveAvatar = async () => {
    if (!user?.id || !currentUrl) return;

    setIsUploading(true);
    try {
      // Delete from storage
      const oldPath = currentUrl.split("/avatars/").pop();
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      setPreviewUrl(null);
      onUpload?.("");
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      console.error("Avatar remove error:", error);
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: "Failed to remove avatar. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentUrl;
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={displayUrl || undefined} alt="Profile picture" />
          <AvatarFallback className="text-lg">
            {initials || <User className="h-8 w-8" />}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        {displayUrl && !isUploading && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
            onClick={handleRemoveAvatar}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload profile picture"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Camera className="h-4 w-4 mr-2" />
        {displayUrl ? "Change Photo" : "Upload Photo"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        JPEG, PNG, WebP or GIF. Max 2MB.
        <br />
        {MIN_DIMENSION}x{MIN_DIMENSION} to {MAX_DIMENSION}x{MAX_DIMENSION} pixels.
      </p>
    </div>
  );
}
