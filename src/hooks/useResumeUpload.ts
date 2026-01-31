import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["application/pdf"];

export function useResumeUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadResume = async (file: File): Promise<string | null> => {
    if (!user?.id) {
      setError("You must be logged in to upload a resume");
      return null;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only PDF files are allowed");
      return null;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 5MB");
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const fileName = `${user.id}/${timestamp}_resume.pdf`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the file path (not public URL since bucket is private)
      return fileName;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload resume";
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const getResumeUrl = async (filePath: string): Promise<string | null> => {
    if (!filePath) return null;

    try {
      const { data, error } = await supabase.storage
        .from("resumes")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch {
      return null;
    }
  };

  const deleteResume = async (filePath: string): Promise<boolean> => {
    if (!filePath) return false;

    try {
      const { error } = await supabase.storage
        .from("resumes")
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch {
      return false;
    }
  };

  return {
    uploadResume,
    getResumeUrl,
    deleteResume,
    isUploading,
    error,
    clearError: () => setError(null),
  };
}
