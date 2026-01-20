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

import { readFile } from "fs/promises";

const mockReadFile = vi.mocked(readFile);

// Test fixtures
const validEnvFile = `
POLAR_ACCESS_TOKEN=polar_test_token
POLAR_ORGANIZATION_ID=org_123
`;

describe("ProductsCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductsCreate.mockReset();
  });

  it("renders section header with environment", () => {
    // Mock initial file reads to trigger loading state
    mockReadFile.mockImplementation(() => new Promise(() => {})); // Never resolves

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

  it("shows error when products file not found", async () => {
    const error = new Error("ENOENT") as NodeJS.ErrnoException;
    error.code = "ENOENT";
    mockReadFile.mockRejectedValue(error);

    const { lastFrame } = render(
      <ProductsCommand env="sandbox" projectDir="/test/project" />
    );

    // Wait for async state update
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

  it("loads credentials and proceeds to product name input", async () => {
    // First call for products file, second for .env file
    mockReadFile
      .mockResolvedValueOnce("[]")
      .mockResolvedValueOnce(validEnvFile);

    const { lastFrame } = render(
      <ProductsCommand env="sandbox" projectDir="/test/project" />
    );

    // Wait for both async operations
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

    // Wait a tick for the useEffect to run
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
