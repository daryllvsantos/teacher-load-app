import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Shift, Teacher } from "@/generated";
import { Button, Card, Input, Select } from "@/components/ui";
import ToastActionForm from "@/components/ToastActionForm";
import type { ActionResult } from "@/lib/action-result";

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

async function createTeacher(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const shift = String(formData.get("shift") || "MORNING") as Shift;

  if (!name) {
    return { status: "error", message: "Please provide a teacher name." };
  }

  await prisma.teacher.create({
    data: {
      name,
      department: department || null,
      email: email || null,
      shift,
    },
  });

  revalidatePath("/teachers");
  return { status: "success", message: "Teacher added successfully." };
}

async function deleteTeacher(
  _previousState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  "use server";
  const id = String(formData.get("id"));
  if (!id) {
    return { status: "error", message: "Teacher not found." };
  }
  await prisma.teacher.delete({ where: { id } });
  revalidatePath("/teachers");
  return { status: "success", message: "Teacher deleted." };
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
  const totalHoursByTeacher = loads.reduce<Record<string, number>>((acc, load) => {
    const duration = calculateDurationHours(load.startTime, load.endTime) ?? 0;
    acc[load.teacherId] = (acc[load.teacherId] ?? 0) + duration;
    return acc;
  }, {});
  teachers.forEach((teacher) => {
    const dailyMax =
      teacher.shift === "AFTERNOON" ? MAX_AFTERNOON_HOURS_PER_DAY : MAX_MORNING_HOURS_PER_DAY;
    maxAllowedByTeacher[teacher.id] = dailyMax * 5;
  });

  return (
    <div className="grid gap-6">
      <Card title="Teachers" description="Create and manage teacher profiles.">
        <ToastActionForm
          serverAction={createTeacher}
          className="grid gap-3 md:grid-cols-4"
          successMessage="Teacher added successfully."
          successVariant="success"
        >
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
        </ToastActionForm>
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
                <th className="py-2">Assigned</th>
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
                    <div className="flex items-center gap-3">
                      <span>
                        {formatHours(totalHoursByTeacher[teacher.id] ?? 0)} hrs /{" "}
                        {formatHours(maxAllowedByTeacher[teacher.id] ?? 0)} assigned
                      </span>
                      <ToastActionForm
                        serverAction={deleteTeacher}
                        successMessage="Teacher deleted."
                        errorMessage="Unable to delete teacher."
                        successVariant="error"
                        requiresConfirm
                        confirmTitle="Delete teacher?"
                        confirmDescription="This will remove the teacher record and cannot be undone."
                        confirmLabel="Delete"
                      >
                        <input type="hidden" name="id" value={teacher.id} />
                        <button
                          aria-label="Delete teacher"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                          title="Delete teacher"
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
