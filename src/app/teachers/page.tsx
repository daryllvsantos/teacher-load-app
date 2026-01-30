import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Shift, Teacher } from "@/generated";
import { Button, Card, Input, Select } from "@/components/ui";

const MAX_MORNING_HOURS_PER_DAY = 6.17;
const MAX_AFTERNOON_HOURS_PER_DAY = 6.67;

const parseTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const calculateDurationHours = (startTime: string, endTime: string) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes <= startMinutes) return null;
  return (endMinutes - startMinutes) / 60;
};

const formatHours = (value: number) => Number(value.toFixed(1));

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
  const [teachers, loads] = await Promise.all([
    prisma.teacher.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.load.findMany({
      select: { teacherId: true, startTime: true, endTime: true, days: true },
    }),
  ]);
  const hoursByTeacherDay = loads.reduce<Record<string, number>>((acc, load) => {
    const duration = calculateDurationHours(load.startTime, load.endTime) ?? 0;
    const weekday = load.days[0]?.weekday ?? "";
    const key = `${load.teacherId}-${weekday}`;
    acc[key] = (acc[key] ?? 0) + duration;
    return acc;
  }, {});
  const maxDayHoursByTeacher = loads.reduce<Record<string, number>>((acc, load) => {
    const weekday = load.days[0]?.weekday ?? "";
    const key = `${load.teacherId}-${weekday}`;
    const dayHours = hoursByTeacherDay[key] ?? 0;
    acc[load.teacherId] = Math.max(acc[load.teacherId] ?? 0, dayHours);
    return acc;
  }, {});
  const maxAllowedByTeacher: Record<string, number> = {};
  teachers.forEach((teacher) => {
    maxAllowedByTeacher[teacher.id] =
      teacher.shift === "AFTERNOON" ? MAX_AFTERNOON_HOURS_PER_DAY : MAX_MORNING_HOURS_PER_DAY;
  });

  return (
    <div className="grid gap-6">
      <Card title="Teachers" description="Create and manage teacher profiles.">
        <form action={createTeacher} className="grid gap-3 md:grid-cols-4">
          <Input name="name" placeholder="Full name" />
          <Input name="department" placeholder="Department (optional)" />
          <Input name="email" placeholder="Email (optional)" type="email" />
          <Select name="shift" defaultValue="MORNING">
            <option value="MORNING">Morning (6:00 AM - 12:10 NN)</option>
            <option value="AFTERNOON">Afternoon (12:00 PM - 7:00 PM)</option>
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
                    {formatHours(
                      (maxAllowedByTeacher[teacher.id] ?? 0) -
                        (maxDayHoursByTeacher[teacher.id] ?? 0)
                    )} hrs left (per day)
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