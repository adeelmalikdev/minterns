import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface TwoFactorSetupData {
  secret: string;
  otpAuthUri: string;
  backupCodes: string[];
  qrCodeUrl: string;
}

interface TwoFactorStatus {
  enabled: boolean;
  hasBackupCodes: boolean;
  backupCodesCount: number;
}

export function useTwoFactor() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);

  // Fetch 2FA status
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["2fa-status", user?.id],
    queryFn: async (): Promise<TwoFactorStatus> => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_2fa")
        .select("totp_enabled, backup_codes")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      return {
        enabled: data?.totp_enabled ?? false,
        hasBackupCodes: (data?.backup_codes?.length ?? 0) > 0,
        backupCodesCount: data?.backup_codes?.length ?? 0,
      };
    },
    enabled: !!user?.id,
  });

  // Initialize 2FA setup
  const setupMutation = useMutation({
    mutationFn: async (): Promise<TwoFactorSetupData> => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("totp-setup", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      return data as TwoFactorSetupData;
    },
    onSuccess: (data) => {
      setSetupData(data);
    },
  });

  // Verify and enable 2FA
  const verifyMutation = useMutation({
    mutationFn: async ({ code, action }: { code: string; action: "enable" | "verify" | "disable" }) => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("totp-verify", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { code, action },
      });

      if (error) throw error;
      if (!data.verified) throw new Error("Invalid code");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
      setSetupData(null);
    },
  });

  // Disable 2FA
  const disableMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("totp-verify", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { code, action: "disable" },
      });

      if (error) throw error;
      if (!data.verified) throw new Error("Invalid code");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-status"] });
    },
  });

  return {
    status,
    statusLoading,
    setupData,
    initiateSetup: setupMutation.mutate,
    isSettingUp: setupMutation.isPending,
    setupError: setupMutation.error,
    verifyAndEnable: (code: string) => verifyMutation.mutateAsync({ code, action: "enable" }),
    verifyCode: (code: string) => verifyMutation.mutateAsync({ code, action: "verify" }),
    isVerifying: verifyMutation.isPending,
    verifyError: verifyMutation.error,
    disable: disableMutation.mutate,
    isDisabling: disableMutation.isPending,
    disableError: disableMutation.error,
    clearSetupData: () => setSetupData(null),
  };
}
