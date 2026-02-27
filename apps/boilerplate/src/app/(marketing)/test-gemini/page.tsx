import { createMetadata, getDefaultMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: "Test Gemini Page",
  description: "This page was built by the gemini adapter.",
});

export default function TestGeminiPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold tracking-tight mb-4">
        Test Gemini Page
      </h1>
      <p className="text-muted-foreground mb-8">
        This page was built by the gemini adapter.
      </p>
    </div>
  );
}
