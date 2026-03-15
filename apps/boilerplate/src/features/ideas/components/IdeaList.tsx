import { locales } from "@/locales";
import { IdeaCard, type IdeaWithAuthor } from "./IdeaCard";

type IdeaListProps = {
  ideas: IdeaWithAuthor[];
  currentUserId: string | null;
  isBoardOwner: boolean;
  loginUrl: string;
};

export function IdeaList({ ideas, currentUserId, isBoardOwner, loginUrl }: IdeaListProps) {
  if (ideas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">
          {locales.PublicBoardView.emptyBoard}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ideas.map((idea) => (
        <IdeaCard
          key={idea.id}
          idea={idea}
          currentUserId={currentUserId}
          isBoardOwner={isBoardOwner}
          loginUrl={loginUrl}
        />
      ))}
    </div>
  );
}
