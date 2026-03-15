import { createMetadata, getDefaultMetadata } from "@/lib/metadata";
import { locales } from "@/locales";
import { BoardForm } from "@/features/boards/components/BoardForm";

export const metadata = createMetadata({
  ...getDefaultMetadata(),
  title: locales.CreateBoardPage.metadata.title,
  description: locales.CreateBoardPage.metadata.description,
});

export default function CreateBoardPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-4xl font-bold">
        {locales.CreateBoardPage.metadata.title}
      </h1>
      <BoardForm />
    </div>
  );
}
