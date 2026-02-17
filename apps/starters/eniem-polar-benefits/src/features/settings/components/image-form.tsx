"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";
import { type UpdateImageInput, updateImageSchema } from "../settings.schemas";
import { updateImageAction } from "../settings.action";
import { useUserUpdate } from "../hooks/use-user-update";
import type { UserInfos } from "../settings.types";
import { locales } from "@/locales";
import { env } from "@/config";

interface ImageFormProps {
  /** Current user information */
  user: UserInfos;
  /** Callback when image is updated successfully */
  onImageUpdated?: (updatedUser: UserInfos) => void;
}

/**
 * Image form component for updating user profile picture
 * Handles file upload and preview
 */
export function ImageForm({ user, onImageUpdated }: ImageFormProps) {
  const { updateUserImage, isLoading } = useUserUpdate();
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<UpdateImageInput>({
    resolver: zodResolver(updateImageSchema()),
  });
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    let nok = false;

    // Validate file size
    if (file.size > env.upload.maxFileSizeBytes) {
      toast.error(locales.ImageForm.errors.imageTooLarge);
      nok = true;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(locales.ImageForm.errors.invalidImageType);
      nok = true;
    }

    if (nok) {
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Set form value and mark as dirty
    form.setValue("image", file, { shouldDirty: true });

    // Auto-submit when file is selected
    try {
      await onSubmit({ image: file });
    } catch (error) {
      console.error("Auto-upload error:", error);
    }
  };

  const onSubmit = async (data: UpdateImageInput) => {
    try {
      // Double-check file size before sending
      if (data.image && data.image.size > env.upload.maxFileSizeBytes) {
        toast.error(locales.ImageForm.errors.imageTooLarge);
        return;
      }

      // First upload the image to get the URL
      const uploadResult = await updateImageAction(data);

      if (uploadResult?.data?.imageUrl) {
        // Then update the user with the new image URL
        const updatedUser = await updateUserImage(uploadResult.data.imageUrl);

        form.reset();
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setPreview(null);

        if (updatedUser && onImageUpdated) {
          onImageUpdated({ ...user, image: uploadResult.data.imageUrl });
        }
      } else {
        toast.error(locales.ImageForm.errors.imageUpdateFailed);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(locales.ImageForm.errors.imageUpdateFailed);
    }
  };

  const isSubmitting = form.formState.isSubmitting || isLoading;
  const currentImageUrl = preview || user.image;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{locales.ImageForm.title}</CardTitle>
        <CardDescription>{locales.ImageForm.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start space-x-4">
            <Avatar
              className="h-20 w-20 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {currentImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImageUrl}
                  alt={locales.ImageForm.image.alt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xl">
                    {user.name?.charAt(0)?.toUpperCase() ||
                      user.email?.charAt(0)?.toUpperCase() ||
                      "?"}
                  </span>
                </div>
              )}
            </Avatar>

            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                {locales.ImageForm.uploadText}
              </p>
              <p className="text-sm text-muted-foreground">
                {locales.ImageForm.optionalText}
              </p>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="hidden">
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isSubmitting}
              ref={fileInputRef}
              className="hidden"
            />
          </form>

          {form.formState.errors.image && (
            <p className="text-sm text-red-500">
              {String(form.formState.errors.image.message)}
            </p>
          )}

          {isSubmitting && (
            <p className="text-sm text-muted-foreground">
              {locales.ImageForm.uploadingText}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
