"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IdeaStatus } from "@/generated/prisma";
import { IdeaDetail } from "./IdeaDetail";

export type IdeaWithAuthor = {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  adminResponse: string | null;
  createdAt: Date;
  author: { id: string; name: string | null; image: string | null };
};

type IdeaCardProps = {
  idea: IdeaWithAuthor;
  currentUserId: string | null;
  isBoardOwner: boolean;
};

const statusVariant: Record<IdeaStatus, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  PLANNED: "secondary",
  DONE: "outline",
};

export function IdeaCard({ idea, currentUserId, isBoardOwner }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isAuthor = currentUserId === idea.author.id;

  return (
    <Card>
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
    </Card>
  );
}
