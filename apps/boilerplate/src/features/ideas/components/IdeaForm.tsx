"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { locales } from "@/locales";
import { createIdeaAction } from "../actions/idea.action";
import {
  createIdeaSchema,
  type CreateIdeaInput,
} from "../schemas/idea.schema";

type IdeaFormProps = {
  boardId: string;
};

export function IdeaForm({ boardId }: IdeaFormProps) {
  const form = useForm<CreateIdeaInput>({
    resolver: zodResolver(createIdeaSchema),
    defaultValues: { boardId, title: "", description: "" },
  });

  const { execute, isExecuting } = useAction(createIdeaAction, {
    onSuccess: () => {
      toast.success(locales.toasts.ideaSubmitted);
      form.reset({ boardId, title: "", description: "" });
    },
    onError: ({ error }) => {
      toast.error(error.serverError || locales.errors.serverError);
    },
  });

  const onSubmit = (data: CreateIdeaInput) => {
    execute(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="idea-title">{locales.IdeaForm.titleLabel}</Label>
        <Input
          id="idea-title"
          {...form.register("title")}
          placeholder={locales.IdeaForm.titlePlaceholder}
          disabled={isExecuting}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="idea-description">
          {locales.IdeaForm.descriptionLabel}
        </Label>
        <textarea
          id="idea-description"
          {...form.register("description")}
          placeholder={locales.IdeaForm.descriptionPlaceholder}
          disabled={isExecuting}
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-red-500">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <Button type="submit" loading={isExecuting}>
        {locales.IdeaForm.submit}
      </Button>
    </form>
  );
}
