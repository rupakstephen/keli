"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Domain } from "@/generated/prisma/client";

export async function createSubcategory(formData: FormData) {
  const domain = formData.get("domain") as Domain;
  const label = (formData.get("label") as string)?.trim();

  if (!domain || !label) return;

  // Upsert rather than create: adding an already-existing (domain, label)
  // pair is a no-op, not an error the user needs to see.
  await prisma.subcategory.upsert({
    where: { domain_label: { domain, label } },
    update: {},
    create: { domain, label },
  });

  redirect("/subcategories");
}
