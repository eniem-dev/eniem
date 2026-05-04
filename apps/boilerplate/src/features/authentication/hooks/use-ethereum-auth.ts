import { useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiweMessage } from "siwe";
import { authClient, useSession } from "@/lib/auth-client";
import { routes } from "@/config";
import { locales } from "@/locales";

// Must be <= the BetterAuth SIWE nonce TTL (currently 900s) so a valid
// signature is never rejected for an expired server-side nonce.
const SIWE_MESSAGE_TTL_MS = 10 * 60 * 1000;

export function useEthereumAuth(callbackURL?: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { address, chain } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { refetch } = useSession();

  const handleEthereumAuth = async (mode: "signin" | "signup" = "signin") => {
    if (!address || !chain || loading) return;

    setLoading(true);
    try {
      const nonceResult = await authClient.siwe.nonce({
        walletAddress: address,
        chainId: chain.id,
      });

      if (nonceResult.error) {
        const errorMessage =
          mode === "signin"
            ? locales.SocialAuthButtons.ethereumSignInFailed
            : locales.SocialAuthButtons.ethereumSignUpFailed;
        toast.error(nonceResult.error.message || errorMessage);
        return;
      }

      const issuedAt = new Date();
      const expirationTime = new Date(issuedAt.getTime() + SIWE_MESSAGE_TTL_MS);
      const siweMessage = new SiweMessage({
        domain: window.location.hostname,
        address,
        statement:
          mode === "signin"
            ? "Sign in with Ethereum to MyApp"
            : "Sign up with Ethereum to MyApp",
        uri: window.location.origin,
        version: "1",
        chainId: chain.id,
        nonce: nonceResult.data!.nonce,
        issuedAt: issuedAt.toISOString(),
        expirationTime: expirationTime.toISOString(),
      });

      const messageString = siweMessage.prepareMessage();
      const signature = await signMessageAsync({
        message: messageString,
      });

      const verifyResult = await authClient.siwe.verify({
        message: messageString,
        signature,
        walletAddress: address,
        chainId: chain.id,
      });

      if (verifyResult.error) {
        const errorMessage =
          mode === "signin"
            ? locales.SocialAuthButtons.ethereumSignInFailed
            : locales.SocialAuthButtons.ethereumSignUpFailed;
        toast.error(verifyResult.error.message || errorMessage);
      } else {
        refetch();
        router.push(callbackURL ?? routes.dashboard);
      }
    } catch {
      const errorMessage =
        mode === "signin"
          ? locales.SocialAuthButtons.ethereumSignInFailed
          : locales.SocialAuthButtons.ethereumSignUpFailed;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleEthereumAuth,
    loading,
    isEnabled: !!address && !!chain,
  };
}
