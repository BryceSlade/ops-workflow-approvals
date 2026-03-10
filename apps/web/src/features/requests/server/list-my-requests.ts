import { RequestStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";

export type MyRequestListItem = {
  id: string;
  title: string;
  description: string | null;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  workspace: {
    id: string;
    name: string;
  };
};

export async function listMyRequests(): Promise<MyRequestListItem[]> {
  const user = await requireCurrentUser();

  return prisma.workflowRequest.findMany({
    where: {
      createdByUserId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}
