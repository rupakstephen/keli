export function parseAccomplishmentInput(
  formData: FormData
): { title: string; description: string; achievedAt: Date } | null {
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const achievedAtRaw = formData.get("achievedAt") as string;

  if (!title || !description || !achievedAtRaw) return null;

  const achievedAt = new Date(achievedAtRaw);
  if (Number.isNaN(achievedAt.getTime())) return null;

  return { title, description, achievedAt };
}
