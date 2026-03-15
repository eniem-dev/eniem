"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { locales } from "@/locales";
import { routes } from "@/config/routes";
import {
  updateBoardAction,
  deleteBoardAction,
  restoreBoardAction,
} from "../actions/board.action";
import { updateBoardSchema, type UpdateBoardInput } from "../schemas/board.schema";
import type { Board } from "@/generated/prisma";

type BoardSettingsProps = {
  board: Board;
};

export function BoardSettings({ board }: BoardSettingsProps) {
  const router = useRouter();
  const isDeleted = board.deletedAt !== null;

  const form = useForm<UpdateBoardInput>({
    resolver: zodResolver(updateBoardSchema),
    defaultValues: {
      boardId: board.id,
      name: board.name,
      description: board.description ?? "",
    },
  });

  const { execute: executeUpdate, isExecuting: isUpdating } = useAction(
    updateBoardAction,
    {
      onSuccess: () => {
        toast.success(locales.toasts.boardUpdated);
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || locales.errors.serverError);
      },
    }
  );

  const { execute: executeDelete, isExecuting: isDeleting } = useAction(
    deleteBoardAction,
    {
      onSuccess: () => {
        toast.success(locales.toasts.boardDeleted);
        router.push(routes.boards.list);
      },
      onError: ({ error }) => {
        toast.error(error.serverError || locales.errors.serverError);
      },
    }
  );

  const { execute: executeRestore, isExecuting: isRestoring } = useAction(
    restoreBoardAction,
    {
      onSuccess: () => {
        toast.success(locales.toasts.boardRestored);
        router.refresh();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || locales.errors.serverError);
      },
    }
  );

  const onSubmit = (data: UpdateBoardInput) => {
    executeUpdate(data);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{locales.BoardSettings.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{locales.BoardSettings.nameLabel}</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  disabled={isUpdating}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">
                  {locales.BoardSettings.descriptionLabel}
                </Label>
                <textarea
                  id="description"
                  {...form.register("description")}
                  placeholder={locales.BoardSettings.descriptionPlaceholder}
                  disabled={isUpdating}
                  rows={3}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border flex justify-end">
            <Button type="submit" loading={isUpdating}>
              {locales.BoardSettings.save}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            {locales.BoardSettings.dangerZone}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDeleted ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {locales.BoardSettings.restoreTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locales.BoardSettings.restoreDescription}
                </p>
              </div>
              <Button
                variant="outline"
                loading={isRestoring}
                onClick={() => executeRestore({ boardId: board.id })}
              >
                {locales.BoardSettings.restoreButton}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {locales.BoardSettings.deleteTitle}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locales.BoardSettings.deleteDescription}
                </p>
              </div>
              <Button
                variant="destructive"
                loading={isDeleting}
                onClick={() => executeDelete({ boardId: board.id })}
              >
                {locales.BoardSettings.deleteButton}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
