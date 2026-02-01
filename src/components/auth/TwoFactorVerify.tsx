import { useState } from "react";
import { Shield, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

interface TwoFactorVerifyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (code: string) => Promise<void>;
  isVerifying?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
}

export function TwoFactorVerify({
  open,
  onOpenChange,
  onVerify,
  isVerifying = false,
  error = null,
  title = "Two-Factor Authentication",
  description = "Enter the 6-digit code from your authenticator app or a backup code.",
}: TwoFactorVerifyProps) {
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = async () => {
    try {
      await onVerify(code);
      setCode("");
    } catch {
      // Error handled by parent
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length >= 6) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="2fa-code">
              {useBackupCode ? "Backup Code" : "Verification Code"}
            </Label>
            <Input
              id="2fa-code"
              placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
              value={code}
              onChange={(e) => {
                const value = useBackupCode
                  ? e.target.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 8)
                  : e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
              }}
              onKeyDown={handleKeyDown}
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={useBackupCode ? 8 : 6}
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <button
            type="button"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode("");
            }}
            className="text-sm text-primary hover:underline"
          >
            {useBackupCode ? "Use authenticator code" : "Use backup code instead"}
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isVerifying ||
              (useBackupCode ? code.length !== 8 : code.length !== 6)
            }
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
