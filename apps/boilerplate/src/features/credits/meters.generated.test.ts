import { describe, expect, it } from "vitest";

import type { MeterEventNames } from "./meters.generated";
import {
  getMeters,
  getMeter,
  sandboxMeters,
  productionMeters,
  resolveEventDisplayName,
} from "./meters.generated";

describe("meters.generated", () => {
  describe("getMeters", () => {
    it('returns sandboxMeters array for "sandbox" env', () => {
      const meters = getMeters("sandbox");
      expect(meters).toBe(sandboxMeters);
      expect(meters.length).toBeGreaterThan(0);
    });

    it('returns productionMeters array for "production" env', () => {
      const meters = getMeters("production");
      expect(meters).toBe(productionMeters);
      expect(meters.length).toBeGreaterThan(0);
    });
  });

  describe("getMeter", () => {
    it("returns the correct meter object for a valid slug", () => {
      const meter = getMeter("sandbox", "llm-tokens");
      expect(meter).toBeDefined();
      expect(meter?.slug).toBe("llm-tokens");
      expect(meter?.name).toBe("LLM Tokens");
      expect(meter?.polarMeterId).toBe(
        "d1e2f3a4-5678-9abc-def0-1234567890ab"
      );
      expect(meter?.eventNames).toEqual(["use-credit"]);
    });

    it("returns undefined for a nonexistent slug", () => {
      // @ts-expect-error - testing invalid slug at runtime
      const meter = getMeter("sandbox", "nonexistent");
      expect(meter).toBeUndefined();
    });
  });

  describe("sandboxMeters", () => {
    it("preserves literal types (as const)", () => {
      const firstMeter = sandboxMeters[0];
      // Type-level check: slug should be the literal "llm-tokens", not string
      const slug: "llm-tokens" = firstMeter.slug;
      expect(slug).toBe("llm-tokens");
    });
  });

  describe("productionMeters", () => {
    it("has null polarMeterId values", () => {
      for (const meter of productionMeters) {
        expect(meter.polarMeterId).toBeNull();
      }
    });

    it("has same slugs as sandboxMeters", () => {
      const sandboxSlugs = sandboxMeters.map((m) => m.slug).sort();
      const productionSlugs = productionMeters.map((m) => m.slug).sort();
      expect(productionSlugs).toEqual(sandboxSlugs);
    });
  });

  describe("getMeter with production env", () => {
    it("returns production meter with null meterId", () => {
      const meter = getMeter("production", "llm-tokens");
      expect(meter).toBeDefined();
      expect(meter?.slug).toBe("llm-tokens");
      expect(meter?.polarMeterId).toBeNull();
    });
  });

  describe("MeterEventNames", () => {
    it("resolves to correct event name union for llm-tokens", () => {
      // Type-level: MeterEventNames<"llm-tokens"> should be "use-credit"
      const validEvent: MeterEventNames<"llm-tokens"> = "use-credit";
      expect(validEvent).toBe("use-credit");
    });

    it("rejects invalid event names at compile time", () => {
      // @ts-expect-error - "invalid-event" is not a valid event name for llm-tokens
      const _invalid: MeterEventNames<"llm-tokens"> = "invalid-event";
      expect(_invalid).toBeDefined();
    });
  });

  describe("resolveEventDisplayName", () => {
    it("returns meter name for known event name", () => {
      const displayName = resolveEventDisplayName("sandbox", "use-credit");
      expect(displayName).toBe("LLM Tokens");
    });

    it("falls back to raw event name for unknown event", () => {
      const displayName = resolveEventDisplayName("sandbox", "unknown-event");
      expect(displayName).toBe("unknown-event");
    });

    it("works with production environment", () => {
      const displayName = resolveEventDisplayName("production", "use-credit");
      expect(displayName).toBe("LLM Tokens");
    });
  });
});
