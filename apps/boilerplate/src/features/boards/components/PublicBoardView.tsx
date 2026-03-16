"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { locales } from "@/locales";
import { IdeaCard, type IdeaWithAuthor } from "@/features/ideas/components/IdeaCard";
import { IdeaForm } from "@/features/ideas/components/IdeaForm";
import type { IdeaStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";

type PublicBoardViewProps = {
  board: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    ownerId: string;
  };
  ideas: IdeaWithAuthor[];
  isAuthenticated: boolean;
  currentUserId: string | null;
  loginUrl: string;
  activeStatus: IdeaStatus | null;
};

const STATUS_TABS = [
  { key: null, label: locales.PublicBoardView.statusAll },
  { key: "OPEN" as IdeaStatus, label: locales.PublicBoardView.statusOpen },
  { key: "PLANNED" as IdeaStatus, label: locales.PublicBoardView.statusPlanned },
  { key: "DONE" as IdeaStatus, label: locales.PublicBoardView.statusDone },
] as const;

export function PublicBoardView({
  board,
  ideas,
  isAuthenticated,
  currentUserId,
  loginUrl,
  activeStatus,
}: PublicBoardViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showForm, setShowForm] = useState(false);

  const handleTabChange = (status: IdeaStatus | null) => {
    if (status) {
      router.replace(`${pathname}?status=${status}`);
    } else {
      router.replace(pathname);
    }
  };

  const emptyMessage = activeStatus
    ? locales.PublicBoardView.emptyFilter.replace(
        "{status}",
        activeStatus.toLowerCase()
      )
    : locales.PublicBoardView.emptyBoard;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{board.name}</h1>
        {board.description && (
          <p className="mt-1 text-muted-foreground">{board.description}</p>
        )}
      </div>

      <div>
        {isAuthenticated ? (
          <>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                {locales.PublicBoardView.submitIdea}
              </Button>
            )}
            {showForm && (
              <div className="rounded-lg border p-4 space-y-3">
                <IdeaForm boardId={board.id} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  {locales.common.cancel}
                </Button>
              </div>
            )}
          </>
        ) : (
          <a href={loginUrl}>
            <Button variant="outline">
              {locales.PublicBoardView.signInToSubmit}
            </Button>
          </a>
        )}
      </div>

      <div role="tablist" className="flex gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key ?? "all"}
            role="tab"
            aria-selected={activeStatus === tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeStatus === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="space-y-3">
        {ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              currentUserId={currentUserId}
              isBoardOwner={currentUserId === board.ownerId}
              loginUrl={loginUrl}
            />
          ))
        )}
      </div>
    </div>
  );
}
