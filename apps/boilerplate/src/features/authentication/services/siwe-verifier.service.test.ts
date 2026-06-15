import { describe, expect, it } from "vitest";
import { SiweMessage } from "siwe";
import { privateKeyToAccount } from "viem/accounts";

import { verifySiweMessage } from "./siwe-verifier.service";

const TEST_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const WRONG_PRIVATE_KEY =
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const account = privateKeyToAccount(TEST_PRIVATE_KEY);
const wrongAccount = privateKeyToAccount(WRONG_PRIVATE_KEY);

const DOMAIN = "app.example.com";
const NONCE = "abcdef0123456789";
const CHAIN_ID = 1;
const ISSUED_AT = "2026-05-04T12:00:00.000Z";
const EXPIRATION = "2026-05-04T12:10:00.000Z";
const NOW_VALID = new Date("2026-05-04T12:05:00.000Z");

interface BuildOpts {
  domain?: string;
  nonce?: string;
  address?: string;
  chainId?: number;
  issuedAt?: string;
  expirationTime?: string | undefined;
  notBefore?: string;
}

async function buildSignedMessage(opts: BuildOpts = {}) {
  const message = new SiweMessage({
    domain: opts.domain ?? DOMAIN,
    address: opts.address ?? account.address,
    statement: "Sign in",
    uri: `https://${opts.domain ?? DOMAIN}`,
    version: "1",
    chainId: opts.chainId ?? CHAIN_ID,
    nonce: opts.nonce ?? NONCE,
    issuedAt: opts.issuedAt ?? ISSUED_AT,
    expirationTime:
      "expirationTime" in opts ? opts.expirationTime : EXPIRATION,
    notBefore: opts.notBefore,
  }).prepareMessage();

  const signature = await account.signMessage({ message });
  return { message, signature };
}

describe("verifySiweMessage", () => {
  it("succeeds when every binding matches and signature is valid", async () => {
    const { message, signature } = await buildSignedMessage();

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: true, address: account.address });
  });

  it("rejects a wrong-domain replay", async () => {
    const { message, signature } = await buildSignedMessage({
      domain: "evil.example.com",
    });

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "domain-mismatch" });
  });

  it("rejects when the message nonce does not match the issued nonce", async () => {
    const { message, signature } = await buildSignedMessage({
      nonce: "differentnonce0",
    });

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "nonce-mismatch" });
  });

  it("rejects when the message address does not match the request address", async () => {
    const { message, signature } = await buildSignedMessage({
      address: wrongAccount.address,
    });

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "address-mismatch" });
  });

  it("rejects when the expected address is malformed", async () => {
    const { message, signature } = await buildSignedMessage();

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: "not-an-address",
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({
      success: false,
      reason: "invalid-expected-address",
    });
  });

  it("rejects when chain id does not match", async () => {
    const { message, signature } = await buildSignedMessage({ chainId: 137 });

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "chain-id-mismatch" });
  });

  it("rejects an expired message", async () => {
    const { message, signature } = await buildSignedMessage();

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: new Date("2026-05-04T12:11:00.000Z"),
    });

    expect(result).toEqual({ success: false, reason: "expired" });
  });

  it("rejects when no expirationTime is set", async () => {
    const { message, signature } = await buildSignedMessage({
      expirationTime: undefined,
    });

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "missing-expiration" });
  });

  it("rejects a malformed expirationTime", async () => {
    const { message, signature } = await buildSignedMessage();
    const malformed = message.replace(EXPIRATION, "not-a-date");

    const result = await verifySiweMessage({
      message: malformed,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "malformed-message" });
  });

  it("rejects a not-yet-valid message", async () => {
    const { message, signature } = await buildSignedMessage({
      notBefore: "2026-05-04T12:30:00.000Z",
    });

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "not-yet-valid" });
  });

  it("rejects a malformed notBefore", async () => {
    const { message, signature } = await buildSignedMessage({
      notBefore: "2026-05-04T12:01:00.000Z",
    });
    const malformed = message.replace(
      "2026-05-04T12:01:00.000Z",
      "not-a-date",
    );

    const result = await verifySiweMessage({
      message: malformed,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "malformed-message" });
  });

  it("rejects a malformed message string", async () => {
    const result = await verifySiweMessage({
      message: "this is not a SIWE message",
      signature: `0x${"00".repeat(65)}`,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "malformed-message" });
  });

  it("rejects when the message body is tampered after signing", async () => {
    const { message, signature } = await buildSignedMessage();
    const tampered = message.replace("Sign in", "Sign In");

    const result = await verifySiweMessage({
      message: tampered,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "invalid-signature" });
  });

  it("rejects when the signature bytes are tampered", async () => {
    const { message, signature } = await buildSignedMessage();
    const lastNibble = signature.slice(-1);
    const replacementNibble = lastNibble === "0" ? "1" : "0";
    const tamperedSignature = `${signature.slice(0, -1)}${replacementNibble}`;

    const result = await verifySiweMessage({
      message,
      signature: tamperedSignature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "invalid-signature" });
  });

  it("rejects when a different private key signed a valid message", async () => {
    const message = new SiweMessage({
      domain: DOMAIN,
      address: account.address,
      statement: "Sign in",
      uri: `https://${DOMAIN}`,
      version: "1",
      chainId: CHAIN_ID,
      nonce: NONCE,
      issuedAt: ISSUED_AT,
      expirationTime: EXPIRATION,
    }).prepareMessage();
    const signature = await wrongAccount.signMessage({ message });

    const result = await verifySiweMessage({
      message,
      signature,
      expectedDomain: DOMAIN,
      expectedNonce: NONCE,
      expectedAddress: account.address,
      expectedChainId: CHAIN_ID,
      now: NOW_VALID,
    });

    expect(result).toEqual({ success: false, reason: "invalid-signature" });
  });
});
