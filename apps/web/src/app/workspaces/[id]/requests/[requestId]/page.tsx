import Link from "next/link";
import { redirect } from "next/navigation";
import { RequestStatus } from "@prisma/client";
import { auth } from "@/auth";
import { getWorkspaceRequest } from "@/features/requests/server/get-workspace-request";
import {
  isRequestReviewerRole,
  requireRequestWorkspaceMember,
} from "@/features/requests/server/permissions";
import { updateRequestDraft } from "@/features/requests/server/update-request-draft";
import { submitRequest } from "@/features/requests/server/submit-request";
import { approveRequest } from "@/features/requests/server/approve-request";
import { rejectRequest } from "@/features/requests/server/reject-request";

type RequestDetailPageProps = {
  params: Promise<{
    id: string;
    requestId: string;
  }>;
};

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { id: workspaceId, requestId } = await params;
  const membership = await requireRequestWorkspaceMember(workspaceId);
  const request = await getWorkspaceRequest(workspaceId, requestId);

  const canReview = isRequestReviewerRole(membership.role);
  const isDraftOwner =
    request.status === RequestStatus.DRAFT &&
    request.createdByUserId === session.user.id;

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Request Details</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage this request.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Workspace ID: {workspaceId}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Request ID: {request.id}
            </p>
          </div>

          <Link
            href={`/workspaces/${workspaceId}/requests`}
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Back to requests
          </Link>
        </div>

        <section className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">{request.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.createdBy.name ?? request.createdBy.email}
              </p>
            </div>

            <p className="text-sm font-medium">{request.status}</p>
          </div>

          {request.description ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {request.description}
            </p>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No description provided.
            </p>
          )}
        </section>

        {isDraftOwner ? (
          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-medium">Edit draft</h2>

            <form
              action={updateRequestDraft.bind(null, request.id)}
              className="mt-4 space-y-3"
            >
              <input
                type="text"
                name="title"
                defaultValue={request.title}
                className="w-full rounded-md border px-3 py-2 text-sm"
                required
                maxLength={200}
              />

              <textarea
                name="description"
                defaultValue={request.description ?? ""}
                className="min-h-35 w-full rounded-md border px-3 py-2 text-sm"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Save changes
                </button>
              </div>
            </form>

            <div className="mt-4">
              <form action={submitRequest.bind(null, request.id)}>
                <button
                  type="submit"
                  className="rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Submit request
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {canReview && request.status === RequestStatus.SUBMITTED ? (
          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-medium">Review decision</h2>

            <div className="mt-4 flex gap-2">
              <form action={approveRequest.bind(null, request.id)}>
                <button
                  type="submit"
                  className="rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Approve
                </button>
              </form>

              <form action={rejectRequest.bind(null, request.id)}>
                <button
                  type="submit"
                  className="rounded-md border px-4 py-2 text-sm font-medium"
                >
                  Reject
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
