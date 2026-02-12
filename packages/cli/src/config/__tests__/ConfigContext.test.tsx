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

  it("exposes all setter functions", () => {
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
    expect(capturedContext!.setProject).toBeDefined();
    expect(capturedContext!.setAuth).toBeDefined();
    expect(capturedContext!.setAuthSecret).toBeDefined();
    expect(capturedContext!.setOAuth).toBeDefined();
    expect(capturedContext!.setPayment).toBeDefined();
    expect(capturedContext!.setStorage).toBeDefined();
    expect(capturedContext!.setWeb3).toBeDefined();
    expect(capturedContext!.setAnalytics).toBeDefined();
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

  it("setProject is a function", () => {
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

    expect(typeof capturedContext!.setProject).toBe("function");
  });

  it("setAuth is a function", () => {
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

    expect(typeof capturedContext!.setAuth).toBe("function");
  });

  it("setAuthSecret is a function", () => {
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

    expect(typeof capturedContext!.setAuthSecret).toBe("function");
  });

  it("setOAuth is a function", () => {
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

    expect(typeof capturedContext!.setOAuth).toBe("function");
  });

  it("setPayment is a function", () => {
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

    expect(typeof capturedContext!.setPayment).toBe("function");
  });

  it("setStorage is a function", () => {
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

    expect(typeof capturedContext!.setStorage).toBe("function");
  });

  it("setWeb3 is a function", () => {
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

    expect(typeof capturedContext!.setWeb3).toBe("function");
  });

  it("setAnalytics is a function", () => {
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

    expect(typeof capturedContext!.setAnalytics).toBe("function");
  });
});
