import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Load, Subject, Teacher } from "@/generated";
import LoadForm from "@/app/loads/LoadForm";
import { Button, Card, Input, Select, SecondaryButton } from "@/components/ui";

const MAX_HOURS = 6;

async function createLoad(formData: FormData) {
  "use server";
  const teacherId = String(formData.get("teacherId"));
  const subjectId = String(formData.get("subjectId"));
  const hours = Number(formData.get("hours"));

  if (!teacherId || !subjectId || !hours) return;
  if (hours <= 0) return;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { shift: true },
  });
  if (!teacher) return;

  const totalHours = await prisma.load.aggregate({
    where: { teacherId },
    _sum: { hours: true },
  });

  const currentHours = totalHours._sum.hours ?? 0;
  if (currentHours + hours > MAX_HOURS) return;

  await prisma.load.create({
    data: {
      teacherId,
      subjectId,
      shift: teacher.shift,
      hours,
    },
  });

  revalidatePath("/loads");
}

async function updateLoad(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const teacherId = String(formData.get("teacherId"));
  const subjectId = String(formData.get("subjectId"));
  const hours = Number(formData.get("hours"));

  if (!id || !teacherId || !subjectId || !hours) return;
  if (hours <= 0) return;

  const existing = await prisma.load.findUnique({ where: { id } });
  if (!existing) return;

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { shift: true },
  });
  if (!teacher) return;

  const totalHours = await prisma.load.aggregate({
    where: { teacherId },
    _sum: { hours: true },
  });

  const currentHours = totalHours._sum.hours ?? 0;
  const adjustedHours = currentHours - existing.hours + hours;
  if (adjustedHours > MAX_HOURS) return;

  await prisma.load.update({
    where: { id },
    data: {
      teacherId,
      subjectId,
      shift: teacher.shift,
      hours,
    },
  });

  revalidatePath("/loads");
}

async function deleteLoad(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.load.delete({ where: { id } });
  revalidatePath("/loads");
}

export default async function LoadsPage() {
  const [loads, teachers, subjects] = await Promise.all([
    prisma.load.findMany({
      include: { teacher: true, subject: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.teacher.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="grid gap-6">
      <Card
        title="Teacher Loads"
        description={`Assign subjects to teachers. Each teacher can have up to ${MAX_HOURS} hours.`}
      >
        <LoadForm
          createLoad={createLoad}
          teachers={teachers.map((teacher) => ({
            id: teacher.id,
            name: teacher.name,
            shift: teacher.shift,
          }))}
          subjects={subjects.map((subject) => ({
            id: subject.id,
            code: subject.code,
            name: subject.name,
          }))}
        />
      </Card>

      <Card title="Current Loads">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="py-2">Teacher</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Hours</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loads.map((load: Load & { teacher: Teacher; subject: Subject }) => (
                <tr key={load.id} className="border-t border-[var(--border)]">
                  <td className="py-3">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {load.teacher.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {load.teacher.shift === "MORNING" ? "Morning" : "Afternoon"} shift
                    </p>
                  </td>
                  <td className="py-3">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {load.subject.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{load.subject.code}</p>
                  </td>
                  <td className="py-3">
                    <form action={updateLoad} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={load.id} />
                      <input type="hidden" name="teacherId" value={load.teacherId} />
                      <input type="hidden" name="subjectId" value={load.subjectId} />
                      <Input name="hours" defaultValue={String(load.hours)} type="number" />
                      <Button>Save</Button>
                      <SecondaryButton>
                        <span className="text-xs">Cancel</span>
                      </SecondaryButton>
                    </form>
                  </td>
                  <td className="py-3 align-top">
                    <form action={deleteLoad}>
                      <input type="hidden" name="id" value={load.id} />
                      <button
                        aria-label="Delete load"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50"
                        title="Delete load"
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
              {loads.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-[var(--text-muted)]" colSpan={4}>
                    No loads assigned yet.
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
