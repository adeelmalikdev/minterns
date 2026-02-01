import { useState } from "react";
import { Download, Loader2, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function DataExportButton() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!session?.access_token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to export your data.",
      });
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-user-data", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Your data has been downloaded as a JSON file.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
      className="w-full sm:w-auto"
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileJson className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Exporting..." : "Export My Data"}
    </Button>
  );
}
