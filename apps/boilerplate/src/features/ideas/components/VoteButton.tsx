"use client";

import { useOptimistic, useTransition } from "react";
import { ChevronUp } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { locales } from "@/locales";
import { toggleVoteAction } from "../actions/vote.action";

type VoteButtonProps = {
  ideaId: string;
  voteCount: number;
  hasVoted: boolean;
  isAuthenticated: boolean;
  loginUrl: string;
};

export function VoteButton({
  ideaId,
  voteCount,
  hasVoted,
  isAuthenticated,
  loginUrl,
}: VoteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { count: voteCount, voted: hasVoted },
    (_current, newState: { count: number; voted: boolean }) => newState
  );

  const { execute } = useAction(toggleVoteAction, {
    onError: ({ error }) => {
      toast.error(error.serverError || locales.errors.voteFailed);
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      window.location.href = loginUrl;
      return;
    }

    if (isPending) return;

    startTransition(() => {
      setOptimistic({
        count: optimistic.voted ? optimistic.count - 1 : optimistic.count + 1,
        voted: !optimistic.voted,
      });
      execute({ ideaId });
    });
  };

  const label = optimistic.voted
    ? locales.VoteButton.removeUpvoteLabel.replace("{count}", String(optimistic.count))
    : locales.VoteButton.upvoteLabel.replace("{count}", String(optimistic.count));

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={optimistic.voted}
      aria-label={label}
      className={cn(
        "flex h-auto flex-col items-center gap-0.5 px-2 py-1.5",
        optimistic.voted
          ? "text-primary hover:text-primary"
          : "text-muted-foreground"
      )}
    >
      <ChevronUp
        className={cn(
          "h-4 w-4",
          optimistic.voted && "fill-primary"
        )}
      />
      <span className="text-xs font-medium">{optimistic.count}</span>
    </Button>
  );
}
