import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Shift, Teacher } from "@/generated";
import { Button, Card, Input, Select } from "@/components/ui";

const MAX_HOURS = 6;

async function createTeacher(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const shift = String(formData.get("shift") || "MORNING") as Shift;

  if (!name) return;

  await prisma.teacher.create({
    data: {
      name,
      department: department || null,
      email: email || null,
      shift,
    },
  });

  revalidatePath("/teachers");
}

async function deleteTeacher(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.teacher.delete({ where: { id } });
  revalidatePath("/teachers");
}

export default async function TeachersPage() {
  const [teachers, loadHours] = await Promise.all([
    prisma.teacher.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.load.groupBy({
      by: ["teacherId"],
      _sum: { hours: true },
    }),
  ]);
  const teacherHours = Object.fromEntries(
    loadHours.map((entry) => [entry.teacherId, entry._sum.hours ?? 0])
  );

  return (
    <div className="grid gap-6">
      <Card title="Teachers" description="Create and manage teacher profiles.">
        <form action={createTeacher} className="grid gap-3 md:grid-cols-4">
          <Input name="name" placeholder="Full name" />
          <Input name="department" placeholder="Department (optional)" />
          <Input name="email" placeholder="Email (optional)" type="email" />
          <Select name="shift" defaultValue="MORNING">
            <option value="MORNING">Morning (6:00 AM - 12:00 NN)</option>
            <option value="AFTERNOON">Afternoon (1:00 PM - 7:00 PM)</option>
          </Select>
          <div className="md:col-span-4">
            <Button>Add Teacher</Button>
          </div>
        </form>
      </Card>

      <Card title="Current Teachers">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Department</th>
                <th className="py-2">Email</th>
                <th className="py-2">Shift</th>
                <th className="py-2">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher: Teacher) => (
                <tr key={teacher.id} className="border-t border-[var(--border)]">
                  <td className="py-3">
                    <Link
                      className="font-semibold text-[var(--text-primary)] hover:text-[var(--primary)]"
                      href={`/teachers/${teacher.id}`}
                    >
                      {teacher.name}
                    </Link>
                  </td>
                  <td className="py-3 text-[var(--text-muted)]">{teacher.department ?? "-"}</td>
                  <td className="py-3 text-[var(--text-muted)]">{teacher.email ?? "-"}</td>
                  <td className="py-3 text-[var(--text-muted)]">
                    {teacher.shift === "MORNING" ? "Morning" : "Afternoon"}
                  </td>
                  <td className="py-3 text-xs font-semibold text-[var(--text-primary)]">
                    {MAX_HOURS - (teacherHours[teacher.id] ?? 0)} hrs left
                  </td>
                </tr>
              ))}
              {teachers.length === 0 && (
                <tr>
                  <td className="py-6 text-sm text-[var(--text-muted)]" colSpan={5}>
                    No teachers added yet.
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