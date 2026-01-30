import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Subject } from "@/generated";
import { Button, Card, Input, SecondaryButton } from "@/components/ui";
import ToastActionForm from "@/components/ToastActionForm";
import type { ActionResult } from "@/lib/action-result";

async function createSubject(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "").trim();

  if (!code || !name || !color) {
    return { status: "error", message: "Please complete all subject details." };
  }

  await prisma.subject.create({
    data: {
      code,
      name,
      color,
    },
  });

  revalidatePath("/subjects");
  return { status: "success", message: "Subject added successfully." };
}

async function updateSubject(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const id = String(formData.get("id"));
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "").trim();

  if (!id || !code || !name || !color) {
    return { status: "error", message: "Please complete all subject details." };
  }

  await prisma.subject.update({
    where: { id },
    data: {
      code,
      name,
      color,
    },
  });

  revalidatePath("/subjects");
  return { status: "success", message: "Subject updated successfully." };
}

async function deleteSubject(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const id = String(formData.get("id"));
  if (!id) {
    return { status: "error", message: "Subject not found." };
  }
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/subjects");
  return { status: "success", message: "Subject deleted." };
}

export default async function SubjectsPage() {
  const subjects: Subject[] = await prisma.subject.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="grid gap-6">
      <Card title="Subjects" description="Manage subject codes and schedule colors.">
        <ToastActionForm
          serverAction={createSubject}
          className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center"
          successMessage="Subject added successfully."
          successVariant="success"
        >
          <Input name="code" placeholder="Subject code" />
          <Input name="name" placeholder="Subject name" />
          <div className="flex items-center gap-2">
            <Input name="color" placeholder="#0f766e" type="color" />
            <span className="text-xs text-[var(--text-muted)]">#0f766e</span>
          </div>
          <div className="md:col-span-3">
            <Button>Add Subject</Button>
          </div>
        </ToastActionForm>
      </Card>

      <Card title="Current Subjects">
        <div className="grid gap-3 text-sm text-[var(--text-primary)]">
          <div className="hidden items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold uppercase text-[var(--text-muted)] md:grid md:grid-cols-[minmax(160px,1fr)_minmax(200px,1fr)_minmax(140px,auto)_minmax(160px,auto)]">
            <span>Code</span>
            <span>Name</span>
            <span>Color</span>
            <span className="text-right">Actions</span>
          </div>
          {subjects.map((subject: Subject) => (
            <div key={subject.id} className="rounded-xl border border-[var(--border)] px-3 py-2">
              <div className="grid gap-2 md:grid-cols-[minmax(160px,1fr)_minmax(200px,1fr)_minmax(140px,auto)_minmax(160px,auto)] md:items-center">
                <ToastActionForm
                  serverAction={updateSubject}
                  className="contents"
                  successMessage="Subject updated."
                  successVariant="success"
                >
                  <input type="hidden" name="id" value={subject.id} />
                  <Input name="code" defaultValue={subject.code} />
                  <Input name="name" defaultValue={subject.name} />
                  <div className="flex items-center gap-2">
                    <Input name="color" defaultValue={subject.color} type="color" />
                    <span className="text-xs text-[var(--text-muted)]">{subject.color}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Button>Save</Button>
                    <SecondaryButton>
                      <span className="text-xs">Cancel</span>
                    </SecondaryButton>
                    <button
                      aria-label="Delete subject"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                      title="Delete subject"
                      type="submit"
                      form={`delete-${subject.id}`}
                    >
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 7h12m-9 0V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0h10m-9 4v6m4-6v6m4-6v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"
                        />
                      </svg>
                    </button>
                  </div>
                </ToastActionForm>
                <ToastActionForm
                  serverAction={deleteSubject}
                  id={`delete-${subject.id}`}
                  className="hidden"
                  successMessage="Subject deleted."
                  errorMessage="Unable to delete subject."
                  successVariant="error"
                  requiresConfirm
                  confirmTitle="Delete subject?"
                  confirmDescription="This will remove the subject record and cannot be undone."
                  confirmLabel="Delete"
                >
                  <input type="hidden" name="id" value={subject.id} />
                </ToastActionForm>
              </div>
            </div>
          ))}
          {subjects.length === 0 && (
            <div className="py-6 text-sm text-[var(--text-muted)]">No subjects added yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}