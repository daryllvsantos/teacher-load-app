import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Button, Card, Input, Select } from "@/components/ui";
import ToastActionForm from "@/components/ToastActionForm";
import type { ActionResult } from "@/lib/action-result";

async function createClass(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const gradeLevel = String(formData.get("gradeLevel") || "").trim();
  const section = String(formData.get("section") || "").trim();
  const adviser = String(formData.get("adviser") || "").trim();
  const shift = String(formData.get("shift") || "MORNING").trim();
  const color = String(formData.get("color") || "").trim();

  if (!gradeLevel || !section || !adviser || !shift || !color) {
    return { status: "error", message: "Please complete all class details." };
  }

  await prisma.class.create({
    data: {
      gradeLevel,
      section,
      adviser,
      shift: shift === "AFTERNOON" ? "AFTERNOON" : "MORNING",
      color,
    },
  });

  revalidatePath("/classes");
  return { status: "success", message: "Class added successfully." };
}

async function deleteClass(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const id = String(formData.get("id"));
  if (!id) {
    return { status: "error", message: "Class not found." };
  }
  await prisma.class.delete({ where: { id } });
  revalidatePath("/classes");
  return { status: "success", message: "Class deleted." };
}

async function updateClassColor(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const id = String(formData.get("id"));
  const color = String(formData.get("color") || "").trim();
  if (!id || !color) {
    return { status: "error", message: "Please select a class color." };
  }
  await prisma.class.update({ where: { id }, data: { color } });
  revalidatePath("/classes");
  return { status: "success", message: "Class color updated." };
}

export default async function ClassesPage() {
  const [classes, teachers] = await Promise.all([
    prisma.class.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.teacher.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="grid gap-6">
      <Card title="Classes" description="Create and manage class sections.">
        <ToastActionForm
          serverAction={createClass}
          className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-center"
          successMessage="Class added successfully."
          successVariant="success"
        >
          <Input name="gradeLevel" placeholder="Grade level (e.g., Grade 6)" />
          <Input name="section" placeholder="Section (e.g., Dayap)" />
          <Select name="adviser" defaultValue="">
            <option value="">Select adviser</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.name}>
                {teacher.name}
              </option>
            ))}
          </Select>
          <Select name="shift" defaultValue="MORNING">
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
          </Select>
          <div className="flex items-center gap-2">
            <Input name="color" placeholder="#1d4ed8" type="color" />
            <span className="text-xs text-[var(--text-muted)]">#1d4ed8</span>
          </div>
          <div className="md:col-span-5">
            <Button>Add Class</Button>
          </div>
        </ToastActionForm>
      </Card>

      <Card title="Current Classes">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="py-2">Grade</th>
                <th className="py-2">Section</th>
                <th className="py-2">Adviser</th>
                <th className="py-2">Shift</th>
                <th className="py-2">Color</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((classItem: (typeof classes)[number]) => {
                const formId = `class-color-${classItem.id}`;
                return (
                  <tr key={classItem.id} className="border-t border-[var(--border)]">
                    <td className="py-3 font-semibold">
                      <Link
                        className="text-[var(--text-primary)] hover:text-[var(--primary)]"
                        href={`/classes/${classItem.id}`}
                      >
                        {classItem.gradeLevel}
                      </Link>
                    </td>
                    <td className="py-3 text-[var(--text-muted)]">{classItem.section}</td>
                    <td className="py-3 text-[var(--text-muted)]">{classItem.adviser}</td>
                    <td className="py-3 text-[var(--text-muted)]">
                      {classItem.shift === "AFTERNOON" ? "Afternoon" : "Morning"}
                    </td>
                    <td className="py-3">
                      <ToastActionForm
                        serverAction={updateClassColor}
                        className="flex items-center gap-2"
                        successMessage="Class color updated."
                        errorMessage="Unable to update class color."
                        successVariant="success"
                        id={formId}
                      >
                        <input type="hidden" name="id" value={classItem.id} />
                        <Input
                          name="color"
                          type="color"
                          defaultValue={classItem.color}
                          aria-label="Class color"
                        />
                      </ToastActionForm>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button type="submit" form={formId} className="h-7 px-3 text-xs">
                          Save
                        </Button>
                        <ToastActionForm
                          serverAction={deleteClass}
                          successMessage="Class deleted."
                          errorMessage="Unable to delete class."
                          successVariant="error"
                          requiresConfirm
                          confirmTitle="Delete class?"
                          confirmDescription="This will remove the class section and its schedule links."
                          confirmLabel="Delete"
                        >
                          <input type="hidden" name="id" value={classItem.id} />
                          <button
                            aria-label="Delete class"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                            title="Delete class"
                            type="submit"
                          >
                            <svg
                              aria-hidden="true"
                              className="h-3 w-3"
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
                        </ToastActionForm>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {classes.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-[var(--text-muted)]" colSpan={6}>
                    No classes added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
