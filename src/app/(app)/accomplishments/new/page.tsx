import { Field } from "@/components/Field";
import { createAccomplishment } from "../actions";

export default function NewAccomplishmentPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-semibold">Add accomplishment</h1>

      <form action={createAccomplishment} className="space-y-4">
        <Field label="Title" htmlFor="title">
          <input
            id="title"
            name="title"
            required
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <Field label="Write-up" htmlFor="description">
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <Field label="Date" htmlFor="achievedAt">
          <input
            id="achievedAt"
            name="achievedAt"
            type="date"
            required
            className="w-full rounded border px-2 py-1"
          />
        </Field>
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">
          Save
        </button>
      </form>
    </div>
  );
}
