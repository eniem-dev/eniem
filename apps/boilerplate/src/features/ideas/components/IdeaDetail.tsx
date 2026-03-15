"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { locales } from "@/locales";
import { updateIdeaAction, deleteIdeaAction } from "../actions/idea.action";
import { updateIdeaSchema, type UpdateIdeaInput } from "../schemas/idea.schema";
import type { IdeaWithAuthor } from "./IdeaCard";

type IdeaDetailProps = {
  idea: IdeaWithAuthor;
  isAuthor: boolean;
  isBoardOwner: boolean;
  onCollapse: () => void;
};

export function IdeaDetail({
  idea,
  isAuthor,
  isBoardOwner,
  onCollapse,
}: IdeaDetailProps) {
  const [editing, setEditing] = useState(false);

  const form = useForm<UpdateIdeaInput>({
    resolver: zodResolver(updateIdeaSchema),
    defaultValues: {
      ideaId: idea.id,
      title: idea.title,
      description: idea.description ?? "",
    },
  });

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(
    updateIdeaAction,
    {
      onSuccess: () => {
        toast.success(locales.toasts.ideaUpdated);
        setEditing(false);
      },
      onError: ({ error }) => {
        toast.error(error.serverError || locales.errors.serverError);
      },
    }
  );

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteIdeaAction,
    {
      onSuccess: () => {
        toast.success(locales.toasts.ideaDeleted);
        onCollapse();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || locales.errors.serverError);
      },
    }
  );

  const onSubmit = (data: UpdateIdeaInput) => {
    executeUpdate(data);
  };

  const handleDelete = () => {
    if (!window.confirm(locales.IdeaAdmin.deleteConfirm)) return;
    executeDelete({ ideaId: idea.id });
  };

  if (editing) {
    return (
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`edit-title-${idea.id}`}>
            {locales.IdeaForm.titleLabel}
          </Label>
          <Input
            id={`edit-title-${idea.id}`}
            {...form.register("title")}
            disabled={isUpdating}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-red-500">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`edit-desc-${idea.id}`}>
            {locales.IdeaForm.descriptionLabel}
          </Label>
          <textarea
            id={`edit-desc-${idea.id}`}
            {...form.register("description")}
            disabled={isUpdating}
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={isUpdating}>
            {locales.common.save}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              form.reset();
              setEditing(false);
            }}
            disabled={isUpdating}
          >
            {locales.common.cancel}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      {idea.description && (
        <p className="whitespace-pre-wrap text-sm">{idea.description}</p>
      )}

      {idea.adminResponse && (
        <div className="rounded-md border bg-muted/50 p-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {locales.IdeaCard.adminResponse}
          </p>
          <p className="text-sm">{idea.adminResponse}</p>
        </div>
      )}

      {(isAuthor || isBoardOwner) && (
        <div className="flex gap-2">
          {isAuthor && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              {locales.IdeaCard.edit}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            loading={isDeleting}
          >
            {locales.IdeaCard.delete}
          </Button>
        </div>
      )}
    </div>
  );
}
