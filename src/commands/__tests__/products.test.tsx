import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "ink-testing-library";
import React from "react";
import { ProductsCommand } from "../products.js";

// Mock fs/promises
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock @polar-sh/sdk
const mockProductsCreate = vi.fn();
vi.mock("@polar-sh/sdk", () => {
  return {
    Polar: class MockPolar {
      products = { create: mockProductsCreate };
      constructor(public options: { accessToken: string; server: string }) {}
    },
  };
});

import { readFile, writeFile } from "fs/promises";

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);

// Test fixtures
const validEnvFile = `
POLAR_ACCESS_TOKEN=polar_test_token
POLAR_ORGANIZATION_ID=org_123
`;

const existingProduct = {
  slug: "existing-product",
  name: "Existing Product",
  type: "subscription",
  recurringInterval: "month",
  prices: [{ amountType: "fixed", amount: 1000, currency: "usd" }],
  display: {
    title: "Existing",
    features: [],
    badge: null,
    highlighted: false,
    cta: "Get Started",
  },
  polarProductId: "polar_123",
};

describe("ProductsCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductsCreate.mockReset();
    mockWriteFile.mockResolvedValue(undefined);
  });

  describe("Initial Loading", () => {
    it("renders section header with environment", () => {
      mockReadFile.mockImplementation(() => new Promise(() => {}));

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      expect(lastFrame()).toContain("Create Product");
      expect(lastFrame()).toContain("sandbox");
    });

    it("shows loading state initially", () => {
      mockReadFile.mockImplementation(() => new Promise(() => {}));

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      expect(lastFrame()).toContain("Loading");
    });

    it("shows production environment in header", () => {
      mockReadFile.mockImplementation(() => new Promise(() => {}));

      const { lastFrame } = render(
        <ProductsCommand env="production" projectDir="/test/project" />
      );

      expect(lastFrame()).toContain("production");
    });

    it("reads products from correct environment file", async () => {
      mockReadFile.mockImplementation(() => new Promise(() => {}));

      render(<ProductsCommand env="production" projectDir="/test/project" />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockReadFile).toHaveBeenCalledWith(
        "/test/project/products.production.json",
        "utf-8"
      );
    });

    it("reads sandbox products file by default", async () => {
      mockReadFile.mockImplementation(() => new Promise(() => {}));

      render(<ProductsCommand env="sandbox" projectDir="/test/project" />);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockReadFile).toHaveBeenCalledWith(
        "/test/project/products.sandbox.json",
        "utf-8"
      );
    });
  });

  describe("Error Handling", () => {
    it("shows error when products file not found", async () => {
      const error = new Error("ENOENT") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      mockReadFile.mockRejectedValue(error);

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("not found");
    });

    it("shows error for invalid JSON in products file", async () => {
      mockReadFile.mockResolvedValue("{ invalid json }");

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("invalid JSON");
    });

    it("shows error for non-array products file", async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ not: "array" }));

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("must contain an array");
    });

    it("shows helpful message on error state", async () => {
      const error = new Error("ENOENT") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      mockReadFile.mockRejectedValue(error);

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(lastFrame()).toContain("eniem project directory");
    });
  });

  describe("Credential Loading", () => {
    it("loads credentials and proceeds to product name input", async () => {
      mockReadFile
        .mockResolvedValueOnce("[]")
        .mockResolvedValueOnce(validEnvFile);

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Product Name");
    });

    it("prompts for access token when missing from .env", async () => {
      mockReadFile
        .mockResolvedValueOnce("[]")
        .mockResolvedValueOnce("POLAR_ORGANIZATION_ID=org_123");

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Polar Access Token");
    });

    it("proceeds to product name when access token is present", async () => {
      mockReadFile
        .mockResolvedValueOnce(JSON.stringify({ products: [] }))
        .mockResolvedValueOnce("POLAR_ACCESS_TOKEN=polar_test_token");

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Product Name");
    });

    it("prompts for access token when .env has placeholder value", async () => {
      mockReadFile
        .mockResolvedValueOnce("[]")
        .mockResolvedValueOnce("POLAR_ACCESS_TOKEN=polar_xx");

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Polar Access Token");
    });

    it("prompts for access token when .env file not found", async () => {
      const envError = new Error("ENOENT") as NodeJS.ErrnoException;
      envError.code = "ENOENT";
      mockReadFile
        .mockResolvedValueOnce("[]")
        .mockRejectedValueOnce(envError);

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Polar Access Token");
    });
  });

  describe("Wizard Steps Display", () => {
    it("shows product name input after credentials loaded", async () => {
      mockReadFile
        .mockResolvedValueOnce("[]")
        .mockResolvedValueOnce(validEnvFile);

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Product Name");
      expect(lastFrame()).toContain("Pro Monthly");
    });

    it("shows masked input for access token", async () => {
      mockReadFile
        .mockResolvedValueOnce("[]")
        .mockResolvedValueOnce("");

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Polar Access Token");
      expect(lastFrame()).toContain("polar_...");
    });
  });

  describe("Product File Formats", () => {
    it("handles products file with $schema wrapper", async () => {
      const productsWithSchema = JSON.stringify({
        $schema: "./products.schema.json",
        products: [],
      });
      mockReadFile
        .mockResolvedValueOnce(productsWithSchema)
        .mockResolvedValueOnce(validEnvFile);

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Product Name");
    });

    it("handles products file as direct array", async () => {
      mockReadFile
        .mockResolvedValueOnce("[]")
        .mockResolvedValueOnce(validEnvFile);

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Product Name");
    });

    it("handles products file with existing products", async () => {
      const productsWithExisting = JSON.stringify({
        $schema: "./products.schema.json",
        products: [existingProduct],
      });
      mockReadFile
        .mockResolvedValueOnce(productsWithExisting)
        .mockResolvedValueOnce(validEnvFile);

      const { lastFrame } = render(
        <ProductsCommand env="sandbox" projectDir="/test/project" />
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(lastFrame()).toContain("Product Name");
    });
  });
});
