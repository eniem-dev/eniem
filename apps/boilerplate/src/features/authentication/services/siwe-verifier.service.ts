import { SiweMessage } from "siwe";
import { getAddress, isAddress, isHex, verifyMessage } from "viem";

export type SiweVerifyFailureReason =
  | "malformed-message"
  | "invalid-signature-format"
  | "domain-mismatch"
  | "nonce-mismatch"
  | "invalid-expected-address"
  | "address-mismatch"
  | "chain-id-mismatch"
  | "missing-expiration"
  | "expired"
  | "not-yet-valid"
  | "invalid-signature";

export type SiweVerifyResult =
  | { success: true; address: `0x${string}` }
  | { success: false; reason: SiweVerifyFailureReason };

export interface SiweVerifyInput {
  message: string;
  signature: string;
  expectedDomain: string;
  expectedNonce: string;
  expectedAddress: string;
  expectedChainId: number;
  now: Date;
}

const sameAddress = (a: string, b: string) =>
  isAddress(a) && isAddress(b) && getAddress(a) === getAddress(b);

export async function verifySiweMessage(
  input: SiweVerifyInput,
): Promise<SiweVerifyResult> {
  if (!isAddress(input.expectedAddress)) {
    return { success: false, reason: "invalid-expected-address" };
  }
  if (!isHex(input.signature)) {
    return { success: false, reason: "invalid-signature-format" };
  }

  let parsed: SiweMessage;
  try {
    parsed = new SiweMessage(input.message);
  } catch {
    return { success: false, reason: "malformed-message" };
  }

  if (parsed.domain !== input.expectedDomain) {
    return { success: false, reason: "domain-mismatch" };
  }
  if (parsed.nonce !== input.expectedNonce) {
    return { success: false, reason: "nonce-mismatch" };
  }
  if (!sameAddress(parsed.address, input.expectedAddress)) {
    return { success: false, reason: "address-mismatch" };
  }
  if (parsed.chainId !== input.expectedChainId) {
    return { success: false, reason: "chain-id-mismatch" };
  }

  if (!parsed.expirationTime) {
    return { success: false, reason: "missing-expiration" };
  }
  const expiresAt = new Date(parsed.expirationTime);
  if (Number.isNaN(expiresAt.getTime())) {
    return { success: false, reason: "malformed-message" };
  }
  if (input.now.getTime() >= expiresAt.getTime()) {
    return { success: false, reason: "expired" };
  }

  if (parsed.notBefore) {
    const notBefore = new Date(parsed.notBefore);
    if (Number.isNaN(notBefore.getTime())) {
      return { success: false, reason: "malformed-message" };
    }
    if (input.now.getTime() < notBefore.getTime()) {
      return { success: false, reason: "not-yet-valid" };
    }
  }

  const expectedAddress = getAddress(input.expectedAddress);
  let signatureValid: boolean;
  try {
    signatureValid = await verifyMessage({
      address: expectedAddress,
      message: input.message,
      signature: input.signature,
    });
  } catch {
    return { success: false, reason: "invalid-signature" };
  }

  if (!signatureValid) {
    return { success: false, reason: "invalid-signature" };
  }

  return { success: true, address: expectedAddress };
}
