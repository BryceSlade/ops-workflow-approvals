"use server";

import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth-user";
import { revalidatePath } from "next/cache";
import { WorkspaceRole } from "@prisma/client";

export async function createWorkspace(formData: FormData) {
  const user = await requireCurrentUser();

  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name) {
    throw new Error("Workspace name is required");
  }

  if (name.length > 100) {
    throw new Error("Workspace name must be 100 characters or fewer");
  }

  await prisma.workspace.create({
    data: {
      name,
      members: {
        create: {
          userId: user.id,
          role: WorkspaceRole.ADMIN,
        },
      },
      auditEvents: {
        create: {
          actorUserId: user.id,
          action: "workspace.created",
          message: `Workspace "${name}" created`,
          metadata: {
            workspaceName: name,
          },
        },
      },
    },
  });

  revalidatePath("/workspaces");
}
