"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { locales } from "@/locales";
import type { IdeaStatus } from "@/generated/prisma";
import { updateIdeaStatusAction, setAdminResponseAction } from "../actions/admin.action";
import { deleteIdeaAction } from "../actions/idea.action";

export type AdminIdea = {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  adminResponse: string | null;
  createdAt: Date;
  author: { id: string; name: string | null };
  voteCount: number;
};

type IdeaAdminListProps = {
  ideas: AdminIdea[];
};

const statusColor: Record<IdeaStatus, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  PLANNED: "secondary",
  DONE: "outline",
};

export function IdeaAdminList({ ideas }: IdeaAdminListProps) {
  if (ideas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {locales.IdeaAdmin.emptyList}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {ideas.map((idea) => (
        <IdeaAdminRow key={idea.id} idea={idea} />
      ))}
    </div>
  );
}

function IdeaAdminRow({ idea }: { idea: AdminIdea }) {
  const [responding, setResponding] = useState(false);
  const [responseText, setResponseText] = useState(idea.adminResponse ?? "");

  const { execute: executeStatus, isExecuting: isStatusUpdating } = useAction(
    updateIdeaStatusAction,
    {
      onSuccess: () => toast.success(locales.toasts.statusUpdated),
      onError: ({ error }) =>
        toast.error(error.serverError || locales.errors.serverError),
    }
  );

  const { execute: executeResponse, isExecuting: isResponding } = useAction(
    setAdminResponseAction,
    {
      onSuccess: () => {
        toast.success(locales.toasts.responseAdded);
        setResponding(false);
      },
      onError: ({ error }) =>
        toast.error(error.serverError || locales.errors.serverError),
    }
  );

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteIdeaAction,
    {
      onSuccess: () => toast.success(locales.toasts.ideaDeleted),
      onError: ({ error }) =>
        toast.error(error.serverError || locales.errors.serverError),
    }
  );

  const handleStatusChange = (status: string) => {
    executeStatus({ ideaId: idea.id, status: status as IdeaStatus });
  };

  const handleSaveResponse = () => {
    executeResponse({
      ideaId: idea.id,
      response: responseText.trim() || null,
    });
  };

  const handleRemoveResponse = () => {
    executeResponse({ ideaId: idea.id, response: null });
    setResponseText("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{idea.title}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {idea.author.name ?? "Anonymous"} &middot;{" "}
              {idea.voteCount} {locales.BoardSettings.statsVotes}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              defaultValue={idea.status}
              onValueChange={handleStatusChange}
              disabled={isStatusUpdating}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["OPEN", "PLANNED", "DONE"] as const).map((status) => (
                  <SelectItem key={status} value={status}>
                    <Badge variant={statusColor[status]} className="pointer-events-none">
                      {locales.IdeaStatusBadge[status.toLowerCase() as "open" | "planned" | "done"]}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {idea.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {idea.description}
          </p>
        )}

        {idea.adminResponse && !responding && (
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {locales.IdeaCard.adminResponse}
            </p>
            <p className="text-sm">{idea.adminResponse}</p>
          </div>
        )}

        {responding && (
          <div className="space-y-2">
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder={locales.AdminResponseForm.textareaPlaceholder}
              rows={3}
              disabled={isResponding}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveResponse}
                loading={isResponding}
              >
                {locales.AdminResponseForm.saveButton}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setResponding(false);
                  setResponseText(idea.adminResponse ?? "");
                }}
                disabled={isResponding}
              >
                {locales.AdminResponseForm.cancelButton}
              </Button>
              {idea.adminResponse && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveResponse}
                  loading={isResponding}
                >
                  {locales.AdminResponseForm.removeButton}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {!responding && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResponding(true)}
            >
              {locales.AdminResponseForm.respondButton}
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" loading={isDeleting}>
                {locales.IdeaCard.delete}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {locales.DeleteIdeaDialog.title}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {locales.DeleteIdeaDialog.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {locales.DeleteIdeaDialog.cancelButton}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => executeDelete({ ideaId: idea.id })}
                >
                  {locales.DeleteIdeaDialog.confirmButton}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
