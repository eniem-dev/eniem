"use client";

import { useEffect, useState } from "react";
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
  CardDescription,
} from "@/components/ui/card";
import { locales } from "@/locales";
import { routes } from "@/config/routes";
import { createBoardAction } from "../actions/board.action";
import {
  createBoardSchema,
  type CreateBoardInput,
} from "../schemas/board.schema";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

export function BoardForm() {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<CreateBoardInput>({
    resolver: zodResolver(createBoardSchema),
    defaultValues: { name: "", slug: "", description: "" },
    mode: "onChange",
  });

  const name = form.watch("name");

  useEffect(() => {
    if (!slugTouched) {
      form.setValue("slug", toSlug(name), { shouldValidate: name.length > 0 });
    }
  }, [name, slugTouched, form]);

  const { execute, isExecuting } = useAction(createBoardAction, {
    onSuccess: ({ data }) => {
      toast.success(locales.toasts.boardCreated);
      if (data?.board) {
        router.push(routes.boards.manage(data.board.id));
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError || locales.errors.serverError);
    },
  });

  const onSubmit = (data: CreateBoardInput) => {
    execute(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>{locales.CreateBoardPage.metadata.title}</CardTitle>
          <CardDescription>
            {locales.CreateBoardPage.metadata.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{locales.BoardForm.nameLabel}</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder={locales.BoardForm.namePlaceholder}
                disabled={isExecuting}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">{locales.BoardForm.slugLabel}</Label>
              <Input
                id="slug"
                {...form.register("slug", {
                  onChange: () => setSlugTouched(true),
                })}
                disabled={isExecuting}
              />
              <p className="text-sm text-muted-foreground">
                {locales.BoardForm.slugPreviewPrefix}
                {form.watch("slug") || "my-product"}
              </p>
              {form.formState.errors.slug && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {locales.BoardForm.descriptionLabel}
              </Label>
              <textarea
                id="description"
                {...form.register("description")}
                placeholder={locales.BoardForm.descriptionPlaceholder}
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
          </div>
        </CardContent>
        <CardFooter className="border-t border-border flex justify-end">
          <Button type="submit" loading={isExecuting}>
            {locales.BoardForm.submitCreate}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
