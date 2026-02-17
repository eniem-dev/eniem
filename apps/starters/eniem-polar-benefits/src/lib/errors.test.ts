import { describe, expect, it } from "vitest";

import { ServerError, UnauthorizedError, ValidationError } from "./errors";

describe("ServerError", () => {
  it("creates error with message and default status", () => {
    const error = new ServerError("Something went wrong");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe("ServerError");
  });

  it("creates error with custom status code", () => {
    const error = new ServerError("Not found", 404);
    expect(error.message).toBe("Not found");
    expect(error.statusCode).toBe(404);
  });

  it("is instance of Error", () => {
    const error = new ServerError("Test");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ServerError);
  });
});

describe("UnauthorizedError", () => {
  it("creates error with default message", () => {
    const error = new UnauthorizedError();
    expect(error.message).toBe("Unauthorized");
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe("UnauthorizedError");
  });

  it("creates error with custom message", () => {
    const error = new UnauthorizedError("Access denied");
    expect(error.message).toBe("Access denied");
    expect(error.statusCode).toBe(401);
  });

  it("is instance of ServerError", () => {
    const error = new UnauthorizedError();
    expect(error).toBeInstanceOf(ServerError);
    expect(error).toBeInstanceOf(UnauthorizedError);
  });
});

describe("ValidationError", () => {
  it("creates error with default message", () => {
    const error = new ValidationError();
    expect(error.message).toBe("Validation failed");
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe("ValidationError");
  });

  it("creates error with custom message", () => {
    const error = new ValidationError("Invalid email");
    expect(error.message).toBe("Invalid email");
    expect(error.statusCode).toBe(400);
  });

  it("is instance of ServerError", () => {
    const error = new ValidationError();
    expect(error).toBeInstanceOf(ServerError);
    expect(error).toBeInstanceOf(ValidationError);
  });
});
