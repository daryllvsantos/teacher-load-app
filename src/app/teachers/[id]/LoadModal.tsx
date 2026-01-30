"use client";

import { useState } from "react";
import LoadForm from "@/app/loads/LoadForm";
import type { Shift } from "@/generated";
import { Button, SecondaryButton } from "@/components/ui";
import type { LoadFormState } from "@/app/loads/load-types";

type TeacherOption = {
  id: string;
  name: string;
  shift: Shift;
};

type SubjectOption = {
  id: string;
  code: string;
  name: string;
  color: string;
};

type ClassOption = {
  id: string;
  gradeLevel: string;
  section: string;
};

type LoadModalProps = {
  createLoad: (previousState: LoadFormState, formData: FormData) => Promise<LoadFormState>;
  teacher: TeacherOption;
  subjects: SubjectOption[];
  classes: ClassOption[];
};

export default function LoadModal({ createLoad, teacher, subjects, classes }: LoadModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>
        Add Load
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-[var(--surface)] p-6 shadow-xl ring-1 ring-[var(--border)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add Load</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  Assign a subject and time block to {teacher.name}.
                </p>
              </div>
              <SecondaryButton type="button" onClick={() => setIsOpen(false)}>
                Close
              </SecondaryButton>
            </div>
            <div className="mt-4">
              <LoadForm
                createLoad={createLoad}
                preselectedTeacherId={teacher.id}
                teachers={[teacher]}
                subjects={subjects}
                classes={classes}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}