import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Shift, Weekday } from "@/generated";
import { Button, Card, Input, Select } from "@/components/ui";

async function updateTeacher(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const shift = String(formData.get("shift") || "MORNING") as Shift;

  if (!id || !name) return;

  await prisma.teacher.update({
    where: { id },
    data: {
      name,
      department: department || null,
      email: email || null,
      shift,
    },
  });

  revalidatePath("/teachers");
  revalidatePath(`/teachers/${id}`);
}

async function deleteTeacher(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  if (!id) return;
  await prisma.teacher.delete({ where: { id } });
  revalidatePath("/teachers");
}

const weekdayOrder: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];

const weekdayLabels: Record<Weekday, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

export default async function TeacherDetailPage({
  params,
}: {
  params?: { id?: string } | Promise<{ id?: string }>;
}) {
  const resolvedParams = await Promise.resolve(params ?? {});
  const id = resolvedParams.id;
  if (!id) {
    notFound();
  }
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      loads: {
        include: {
          subject: true,
          days: true,
        },
      },
    },
  });

  if (!teacher) {
    notFound();
  }

  const scheduleByDay = weekdayOrder.map((weekday) => {
    const dayLoads = teacher.loads.filter((load) =>
      load.days.some((day) => day.weekday === weekday)
    );

    return {
      weekday,
      label: weekdayLabels[weekday],
      loads: dayLoads,
    };
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Teacher Profile</p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{teacher.name}</h2>
        </div>
        <Link
          className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)]"
          href="/teachers"
        >
          ← Back to teachers
        </Link>
      </div>

      <Card title="Edit Teacher" description="Update the teacher profile details.">
        <form action={updateTeacher} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={teacher.id} />
          <Input name="name" defaultValue={teacher.name} />
          <Input name="department" defaultValue={teacher.department ?? ""} placeholder="Department" />
          <Input name="email" defaultValue={teacher.email ?? ""} placeholder="Email" type="email" />
          <Select name="shift" defaultValue={teacher.shift}>
            <option value="MORNING">Morning (6:00 AM - 12:00 NN)</option>
            <option value="AFTERNOON">Afternoon (1:00 PM - 7:00 PM)</option>
          </Select>
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <Button>Save Changes</Button>
          </div>
        </form>
        <form action={deleteTeacher} className="mt-3">
          <input type="hidden" name="id" value={teacher.id} />
          <button
            aria-label="Delete teacher"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50"
            title="Delete teacher"
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
      </Card>

      <Card
        title="Weekly Schedule"
        description="Monday to Friday schedule based on assigned loads."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--text-primary)]">
            <thead className="text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="py-2">Day</th>
                <th className="py-2">Subjects</th>
                <th className="py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {scheduleByDay.map((entry) => (
                <tr key={entry.weekday} className="border-t border-[var(--border)]">
                  <td className="py-3 font-semibold text-[var(--text-primary)]">
                    {entry.label}
                  </td>
                  <td className="py-3">
                    {entry.loads.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {entry.loads.map((load) => (
                          <span
                            key={load.id}
                            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]"
                          >
                            {load.subject.code} - {load.subject.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">No load</span>
                    )}
                  </td>
                  <td className="py-3">
                    {entry.loads.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {entry.loads.map((load) => (
                          <span
                            key={`${load.id}-time`}
                            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]"
                          >
                            {load.startTime} - {load.endTime}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">No schedule</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}