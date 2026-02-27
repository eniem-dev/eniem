import { createMetadata, getDefaultMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: "Test Opencode Page",
  description: "Smoke test for opencode adapter's plan+build pipeline",
});

export default function TestOpencodePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Test Opencode Page
      </h1>
      <p className="text-muted-foreground">
        This page was built by the opencode adapter.
      </p>
    </div>
  );
}
