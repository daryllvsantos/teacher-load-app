"use client";

import type { ButtonHTMLAttributes } from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";
import ConfirmDialog from "@/components/ConfirmDialog";

type ToastActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  action: (formData: FormData) => Promise<ActionResult>;
  successMessage?: string;
  errorMessage?: string;
  successVariant?: "success" | "error";
  fields?: Record<string, string>;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requiresConfirm?: boolean;
};

export default function ToastActionButton({
  action,
  successMessage,
  errorMessage,
  successVariant = "success",
  fields,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  cancelLabel,
  requiresConfirm = false,
  ...buttonProps
}: ToastActionButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleAction = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (fields) {
        Object.entries(fields).forEach(([key, value]) => {
          formData.set(key, value);
        });
      }
      const result = await action(formData);
      if (result.status === "success") {
        const message = result.message ?? successMessage ?? "Saved successfully.";
        if (successVariant === "error") {
          toast.error(message);
        } else {
          toast.success(message);
        }
      } else {
        toast.error(result.message ?? errorMessage ?? "Something went wrong.");
      }
    } catch (error) {
      toast.error(errorMessage ?? "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClick = () => {
    if (isSubmitting) return;
    if (requiresConfirm) {
      setIsConfirmOpen(true);
      return;
    }
    void handleAction();
  };

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    void handleAction();
  };

  return (
    <>
      <button
        {...buttonProps}
        onClick={handleClick}
        disabled={isSubmitting || buttonProps.disabled}
        type={buttonProps.type ?? "button"}
      />
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={confirmTitle ?? "Remove this item?"}
        description={
          confirmDescription ?? "This action cannot be undone. Please confirm to proceed."
        }
        confirmLabel={confirmLabel ?? "Delete"}
        cancelLabel={cancelLabel ?? "Cancel"}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
}