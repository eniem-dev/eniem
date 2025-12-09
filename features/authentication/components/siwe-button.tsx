"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { locales } from "@/locales";
import { useEthereumAuth } from "../hooks/use-ethereum-auth";
import { EthereumIcon } from "./icons";

interface SiweButtonProps {
  mode: "signin" | "signup";
  disabled?: boolean;
}

export function SiweButton({ mode, disabled = false }: SiweButtonProps) {
  const { handleEthereumAuth, loading: ethLoading } = useEthereumAuth();

  const authLabels =
    mode === "signin"
      ? {
          ethereum: locales.SocialAuthButtons.signInWithEthereum,
        }
      : {
          ethereum: locales.SocialAuthButtons.signUpWithEthereum,
        };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        if (!ready) {
          return (
            <Button variant="outline" className="w-full gap-2" disabled={true}>
              <EthereumIcon />
              {locales.common.loading}
            </Button>
          );
        }

        if (!connected) {
          return (
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={disabled}
              onClick={openConnectModal}
            >
              <EthereumIcon />
              {locales.SocialAuthButtons.connectWallet}
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={disabled}
              onClick={openChainModal}
            >
              <EthereumIcon />
              {locales.SocialAuthButtons.switchNetwork}
            </Button>
          );
        }

        return (
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={disabled || ethLoading}
            onClick={() => handleEthereumAuth(mode)}
            loading={ethLoading}
          >
            {ethLoading ? null : <EthereumIcon />}
            {authLabels.ethereum}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
