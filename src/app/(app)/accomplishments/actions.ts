"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseAccomplishmentInput } from "@/lib/accomplishmentInput";

export async function createAccomplishment(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const input = parseAccomplishmentInput(formData);
  if (!input) return;

  await prisma.accomplishment.create({
    data: { ...input, createdById: session.user.id },
  });

  redirect("/accomplishments");
}
