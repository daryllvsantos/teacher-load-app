"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";
import ConfirmDialog from "@/components/ConfirmDialog";

type ToastActionFormProps = Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  "action"
> & {
  serverAction: (previousState: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  successMessage?: string;
  errorMessage?: string;
  successVariant?: "success" | "error";
  initialState?: ActionResult;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requiresConfirm?: boolean;
};

const defaultState: ActionResult = { status: "idle" };

export default function ToastActionForm({
  serverAction,
  children,
  className,
  successMessage,
  errorMessage,
  successVariant = "success",
  initialState = defaultState,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  cancelLabel,
  requiresConfirm = false,
  ...formProps
}: ToastActionFormProps) {
  const [state, formAction] = useActionState(serverAction, initialState);
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingSubmitter, setPendingSubmitter] = useState<HTMLElement | null>(null);
  const isConfirmingRef = useRef(false);

  useEffect(() => {
    if (state.status === "success") {
      const message = state.message ?? successMessage ?? "Saved successfully.";
      if (successVariant === "error") {
        toast.error(message);
      } else {
        toast.success(message);
      }
    }
    if (state.status === "error") {
      toast.error(state.message ?? errorMessage ?? "Something went wrong.");
    }
  }, [state, successMessage, errorMessage, successVariant]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!requiresConfirm) return;
    if (isConfirmingRef.current) {
      isConfirmingRef.current = false;
      return;
    }
    event.preventDefault();
    const nativeEvent = event.nativeEvent as SubmitEvent;
    setPendingSubmitter((nativeEvent?.submitter as HTMLElement) ?? null);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    setIsConfirmOpen(false);
    if (formRef.current) {
      isConfirmingRef.current = true;
      formRef.current.requestSubmit(pendingSubmitter ?? undefined);
    }
    setPendingSubmitter(null);
  };

  return (
    <>
      <form
        ref={formRef}
        action={formAction}
        className={className}
        onSubmit={handleSubmit}
        {...formProps}
      >
        {children}
      </form>
      <ConfirmDialog
        isOpen={isConfirmOpen}
        title={confirmTitle ?? "Delete this item?"}
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
