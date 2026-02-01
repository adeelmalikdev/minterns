import { useState } from "react";
import { Shield, ShieldCheck, ShieldOff, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTwoFactor } from "@/hooks/useTwoFactor";
import { TwoFactorSetup } from "@/components/auth/TwoFactorSetup";
import { TwoFactorVerify } from "@/components/auth/TwoFactorVerify";
import { useToast } from "@/hooks/use-toast";

export function SecuritySettings() {
  const { toast } = useToast();
  const {
    status,
    statusLoading,
    disable,
    isDisabling,
    disableError,
  } = useTwoFactor();

  const [showSetup, setShowSetup] = useState(false);
  const [showDisableVerify, setShowDisableVerify] = useState(false);

  const handleDisable2FA = async (code: string) => {
    try {
      await new Promise<void>((resolve, reject) => {
        disable(code, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
      });
      setShowDisableVerify(false);
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
    } catch {
      // Error will be shown in the dialog
    }
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status?.enabled ? (
                <ShieldCheck className="h-8 w-8 text-primary" />
              ) : (
                <ShieldOff className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {status?.enabled ? "2FA is enabled" : "2FA is not enabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status?.enabled
                    ? `${status.backupCodesCount} backup codes remaining`
                    : "Protect your account with authenticator app"}
                </p>
              </div>
            </div>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? "Active" : "Inactive"}
            </Badge>
          </div>

          {status?.enabled && status.backupCodesCount < 3 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have only {status.backupCodesCount} backup codes remaining.
                Consider regenerating your backup codes.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {status?.enabled ? (
              <Button
                variant="outline"
                onClick={() => setShowDisableVerify(true)}
                disabled={isDisabling}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={() => setShowSetup(true)}>
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <TwoFactorSetup
        open={showSetup}
        onOpenChange={setShowSetup}
      />

      <TwoFactorVerify
        open={showDisableVerify}
        onOpenChange={setShowDisableVerify}
        onVerify={handleDisable2FA}
        isVerifying={isDisabling}
        error={disableError?.message}
        title="Disable Two-Factor Authentication"
        description="Enter your authentication code to disable 2FA."
      />
    </>
  );
}
