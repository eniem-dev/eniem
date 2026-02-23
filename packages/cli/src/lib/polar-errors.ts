export interface PolarApiError {
  success: false;
  error: string;
}

export function handlePolarApiError(error: unknown, operation: string): PolarApiError {
  const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

  if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
    return { success: false, error: "Invalid Polar access token. Please check your credentials." };
  }
  if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
    return { success: false, error: "Access denied. Please check your token permissions." };
  }
  if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
    return { success: false, error: "Resource not found on Polar." };
  }
  if (errorMessage.includes("422") || errorMessage.includes("validation")) {
    return { success: false, error: `Validation error: ${errorMessage}` };
  }

  return { success: false, error: `Failed to ${operation}: ${errorMessage}` };
}
