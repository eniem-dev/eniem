"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IdeaStatus } from "@/generated/prisma";
import { IdeaDetail } from "./IdeaDetail";
import { VoteButton } from "./VoteButton";

export type IdeaWithAuthor = {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  adminResponse: string | null;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
  voteCount: number;
  hasVoted: boolean;
};

type IdeaCardProps = {
  idea: IdeaWithAuthor;
  currentUserId: string | null;
  isBoardOwner: boolean;
  loginUrl: string;
};

const statusVariant: Record<IdeaStatus, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  PLANNED: "secondary",
  DONE: "outline",
};

export function IdeaCard({ idea, currentUserId, isBoardOwner, loginUrl }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isAuthor = currentUserId === idea.author.id;

  return (
    <Card>
      <div className="flex">
        <div className="flex items-start border-r px-1 py-3">
          <VoteButton
            ideaId={idea.id}
            voteCount={idea.voteCount}
            hasVoted={idea.hasVoted}
            isAuthenticated={!!currentUserId}
            loginUrl={loginUrl}
          />
        </div>
        <div className="min-w-0 flex-1">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{idea.title}</CardTitle>
              <Badge variant={statusVariant[idea.status]}>{idea.status}</Badge>
            </div>
            {!expanded && idea.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {idea.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {idea.author.name ?? "Anonymous"} &middot;{" "}
              {new Date(idea.createdAt).toLocaleDateString()}
            </p>
          </CardHeader>

          {expanded && (
            <CardContent>
              <IdeaDetail
                idea={idea}
                isAuthor={isAuthor}
                isBoardOwner={isBoardOwner}
                onCollapse={() => setExpanded(false)}
              />
            </CardContent>
          )}
        </div>
      </div>
    </Card>
  );
}
