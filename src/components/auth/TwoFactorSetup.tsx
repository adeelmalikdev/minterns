import { useState } from "react";
import { Shield, Copy, Check, AlertTriangle, Loader2 } from "lucide-react";
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
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useTwoFactor } from "@/hooks/useTwoFactor";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SetupStep = "intro" | "qrcode" | "verify" | "backup" | "complete";

export function TwoFactorSetup({ open, onOpenChange }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const {
    setupData,
    initiateSetup,
    isSettingUp,
    verifyAndEnable,
    isVerifying,
    verifyError,
    clearSetupData,
  } = useTwoFactor();

  const [step, setStep] = useState<SetupStep>("intro");
  const [verificationCode, setVerificationCode] = useState("");
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const handleStartSetup = () => {
    initiateSetup();
    setStep("qrcode");
  };

  const handleVerify = async () => {
    try {
      await verifyAndEnable(verificationCode);
      setStep("backup");
    } catch {
      // Error handled by mutation
    }
  };

  const handleCopyBackupCodes = async () => {
    if (!setupData?.backupCodes) return;
    
    const codesText = setupData.backupCodes.join("\n");
    await navigator.clipboard.writeText(codesText);
    setCopiedBackupCodes(true);
    toast({
      title: "Copied!",
      description: "Backup codes copied to clipboard",
    });
  };

  const handleComplete = () => {
    setStep("complete");
    setTimeout(() => {
      onOpenChange(false);
      setStep("intro");
      setVerificationCode("");
      setCopiedBackupCodes(false);
      clearSetupData();
    }, 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep("intro");
    setVerificationCode("");
    setCopiedBackupCodes(false);
    clearSetupData();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {step === "complete" ? "2FA Enabled!" : "Set Up Two-Factor Authentication"}
          </DialogTitle>
          <DialogDescription>
            {step === "intro" && "Add an extra layer of security to your account."}
            {step === "qrcode" && "Scan this QR code with your authenticator app."}
            {step === "verify" && "Enter the 6-digit code from your authenticator app."}
            {step === "backup" && "Save these backup codes in a safe place."}
            {step === "complete" && "Your account is now protected with 2FA."}
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an additional layer of security by requiring
              a code from your authenticator app when signing in.
            </p>
            <p className="text-sm text-muted-foreground">
              You&apos;ll need an authenticator app like Google Authenticator, Authy, or 1Password.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleStartSetup} disabled={isSettingUp}>
                {isSettingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Started
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "qrcode" && setupData && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <img
                src={setupData.qrCodeUrl}
                alt="QR Code for 2FA setup"
                className="w-48 h-48 rounded-lg border bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Can&apos;t scan? Enter this code manually:
              </Label>
              <code className="block p-2 bg-muted rounded text-xs font-mono break-all text-center">
                {setupData.secret}
              </code>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep("verify")}>
                Continue
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>
            {verifyError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Invalid code. Please try again.
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("qrcode")}>
                Back
              </Button>
              <Button 
                onClick={handleVerify} 
                disabled={verificationCode.length !== 6 || isVerifying}
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "backup" && setupData && (
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Save your backup codes</AlertTitle>
              <AlertDescription>
                If you lose access to your authenticator app, you can use these codes to sign in.
                Each code can only be used once.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
              {setupData.backupCodes.map((code, index) => (
                <code key={index} className="text-sm font-mono text-center py-1">
                  {code}
                </code>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyBackupCodes}
            >
              {copiedBackupCodes ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Backup Codes
                </>
              )}
            </Button>
            <DialogFooter>
              <Button onClick={handleComplete} disabled={!copiedBackupCodes}>
                I&apos;ve Saved My Codes
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center py-6">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <p className="text-center text-muted-foreground">
              Two-factor authentication is now enabled on your account.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
