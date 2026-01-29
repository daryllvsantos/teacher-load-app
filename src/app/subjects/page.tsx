import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Subject } from "@/generated";
import { Button, Card, Input, SecondaryButton } from "@/components/ui";

async function createSubject(formData: FormData) {
  "use server";
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const hours = Number(formData.get("hours"));

  if (!code || !name || !hours) return;

  await prisma.subject.create({
    data: {
      code,
      name,
      hours,
    },
  });

  revalidatePath("/subjects");
}

async function updateSubject(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const hours = Number(formData.get("hours"));

  if (!id || !code || !name || !hours) return;

  await prisma.subject.update({
    where: { id },
    data: {
      code,
      name,
      hours,
    },
  });

  revalidatePath("/subjects");
}

async function deleteSubject(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/subjects");
}

export default async function SubjectsPage() {
  const subjects: Subject[] = await prisma.subject.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="grid gap-6">
      <Card title="Subjects" description="Manage subject codes and assigned hours.">
        <form action={createSubject} className="grid gap-3 md:grid-cols-3">
          <Input name="code" placeholder="Subject code" />
          <Input name="name" placeholder="Subject name" />
          <Input name="hours" placeholder="Hours" type="number" />
          <div className="md:col-span-3">
            <Button>Add Subject</Button>
          </div>
        </form>
      </Card>

      <Card title="Current Subjects">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="py-2">Code</th>
                <th className="py-2">Name</th>
                <th className="py-2">Hours</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject: Subject) => (
                <tr key={subject.id} className="border-t border-[var(--border)]">
                  <td colSpan={3} className="py-3">
                    <form action={updateSubject} className="grid gap-2 md:grid-cols-3">
                      <input type="hidden" name="id" value={subject.id} />
                      <Input name="code" defaultValue={subject.code} />
                      <Input name="name" defaultValue={subject.name} />
                      <Input name="hours" defaultValue={String(subject.hours)} type="number" />
                      <div className="flex gap-2 md:col-span-3">
                        <Button>Save</Button>
                        <SecondaryButton>
                          <span className="text-xs">Cancel</span>
                        </SecondaryButton>
                      </div>
                    </form>
                  </td>
                  <td className="py-3 align-top">
                    <form action={deleteSubject}>
                      <input type="hidden" name="id" value={subject.id} />
                      <button
                        aria-label="Delete subject"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                        title="Delete subject"
                        type="submit"
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
                    </form>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-[var(--text-muted)]" colSpan={4}>
                    No subjects added yet.
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