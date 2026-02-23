import { describe, it, expect } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { ConfigProvider, useConfig } from "../ConfigContext.js";
import { Text } from "ink";

// Test component to access config context
const TestConsumer = () => {
  const config = useConfig();
  return (
    <Text>
      {JSON.stringify(config.config)}
    </Text>
  );
};

describe("ConfigContext", () => {
  it("provides empty config initially", () => {
    const { lastFrame } = render(
      <ConfigProvider>
        <TestConsumer />
      </ConfigProvider>
    );
    expect(lastFrame()).toContain("{}");
  });

  it("exposes updateConfig function", () => {
    let capturedContext: ReturnType<typeof useConfig> | null = null;
    const Capture = () => {
      capturedContext = useConfig();
      return <Text>captured</Text>;
    };

    render(
      <ConfigProvider>
        <Capture />
      </ConfigProvider>
    );

    expect(capturedContext).not.toBeNull();
    expect(capturedContext!.updateConfig).toBeDefined();
    expect(typeof capturedContext!.updateConfig).toBe("function");
  });

  it("config object is accessible", () => {
    let capturedContext: ReturnType<typeof useConfig> | null = null;
    const Capture = () => {
      capturedContext = useConfig();
      return <Text>captured</Text>;
    };

    render(
      <ConfigProvider>
        <Capture />
      </ConfigProvider>
    );

    expect(capturedContext!.config).toBeDefined();
    expect(typeof capturedContext!.config).toBe("object");
  });

  it("updateConfig updates the specified key", () => {
    let capturedContext: ReturnType<typeof useConfig> | null = null;
    const Capture = () => {
      capturedContext = useConfig();
      return <Text>{JSON.stringify(capturedContext?.config)}</Text>;
    };

    render(
      <ConfigProvider>
        <Capture />
      </ConfigProvider>
    );

    expect(capturedContext).not.toBeNull();

    // Call updateConfig with project key
    React.act(() => {
      capturedContext!.updateConfig("project", { name: "test-app" });
    });

    expect(capturedContext!.config.project).toEqual({ name: "test-app" });
  });

  it("updateConfig preserves other config keys", () => {
    let capturedContext: ReturnType<typeof useConfig> | null = null;
    const Capture = () => {
      capturedContext = useConfig();
      return <Text>{JSON.stringify(capturedContext?.config)}</Text>;
    };

    render(
      <ConfigProvider>
        <Capture />
      </ConfigProvider>
    );

    React.act(() => {
      capturedContext!.updateConfig("project", { name: "test-app" });
    });
    React.act(() => {
      capturedContext!.updateConfig("auth", { enabled: true });
    });

    expect(capturedContext!.config.project).toEqual({ name: "test-app" });
    expect(capturedContext!.config.auth).toEqual({ enabled: true });
  });

  it("updateConfig works with authSecret string value", () => {
    let capturedContext: ReturnType<typeof useConfig> | null = null;
    const Capture = () => {
      capturedContext = useConfig();
      return <Text>captured</Text>;
    };

    render(
      <ConfigProvider>
        <Capture />
      </ConfigProvider>
    );

    React.act(() => {
      capturedContext!.updateConfig("authSecret", "my-secret");
    });

    expect(capturedContext!.config.authSecret).toBe("my-secret");
  });

  it("updateConfig works with all config keys", () => {
    let capturedContext: ReturnType<typeof useConfig> | null = null;
    const Capture = () => {
      capturedContext = useConfig();
      return <Text>captured</Text>;
    };

    render(
      <ConfigProvider>
        <Capture />
      </ConfigProvider>
    );

    React.act(() => {
      capturedContext!.updateConfig("project", { name: "app" });
      capturedContext!.updateConfig("auth", { enabled: true });
      capturedContext!.updateConfig("oauth", {});
      capturedContext!.updateConfig("payment", { enabled: false });
      capturedContext!.updateConfig("storage", { enabled: false });
      capturedContext!.updateConfig("web3", { enabled: false });
      capturedContext!.updateConfig("analytics", { enabled: false });
    });

    expect(capturedContext!.config.project).toBeDefined();
    expect(capturedContext!.config.auth).toBeDefined();
    expect(capturedContext!.config.payment).toBeDefined();
    expect(capturedContext!.config.storage).toBeDefined();
    expect(capturedContext!.config.web3).toBeDefined();
    expect(capturedContext!.config.analytics).toBeDefined();
  });
});
