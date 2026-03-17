import Link from "next/link";
import { RequestStatus } from "@prisma/client";
import { SubmitRequestForm } from "@/features/requests/components/submit-request-form";
import { ReviewRequestActions } from "@/features/requests/components/review-request-actions";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createRequestDraft } from "@/features/requests/server/create-request-draft";
import {
  isRequestReviewerRole,
  requireRequestWorkspaceMember,
} from "@/features/requests/server/permissions";
import {
  listWorkspaceRequests,
  type WorkspaceRequestListItem,
} from "@/features/requests/server/list-workspace-requests";
import {
  listMyWorkspaceRequests,
  type MyWorkspaceRequestListItem,
} from "@/features/requests/server/list-my-workspace-requests";

type RequestsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkspaceRequestsPage({
  params,
}: RequestsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { id: workspaceId } = await params;

  let membership;
  try {
    membership = await requireRequestWorkspaceMember(workspaceId);
  } catch {
    redirect("/forbidden");
  }

  const canReview = isRequestReviewerRole(membership.role);

  const reviewerRequests = canReview
    ? await listWorkspaceRequests(workspaceId)
    : [];

  const myRequests = canReview
    ? []
    : await listMyWorkspaceRequests(workspaceId);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Workspace Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and review requests for this workspace.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Workspace ID: {workspaceId}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your role: {membership.role}
          </p>
        </div>

        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Create draft request</h2>

          <form
            action={createRequestDraft.bind(null, workspaceId)}
            className="mt-4 space-y-3"
          >
            <input
              type="text"
              name="title"
              placeholder="Request title"
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
              maxLength={200}
            />

            <textarea
              name="description"
              placeholder="Describe the request"
              className="min-h-30 w-full rounded-md border px-3 py-2 text-sm"
            />

            <button
              type="submit"
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Save draft
            </button>
          </form>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">
            {canReview ? "Workspace requests" : "My requests"}
          </h2>

          {canReview ? (
            reviewerRequests.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                No requests yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {reviewerRequests.map((request: WorkspaceRequestListItem) => (
                  <div key={request.id} className="rounded-md border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/workspaces/${workspaceId}/requests/${request.id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {request.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {request.createdBy.name ?? request.createdBy.email}
                        </p>
                      </div>

                      <p className="text-sm font-medium">{request.status}</p>
                    </div>

                    {request.description ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {request.description}
                      </p>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        Request ID: {request.id}
                      </p>

                      <div className="flex gap-2">
                        {request.status === RequestStatus.DRAFT &&
                        request.createdByUserId === session.user.id ? (
                          <SubmitRequestForm requestId={request.id} />
                        ) : null}

                        {request.status === RequestStatus.SUBMITTED ? (
                          <ReviewRequestActions requestId={request.id} />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : myRequests.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No requests yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {myRequests.map((request: MyWorkspaceRequestListItem) => (
                <div key={request.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      href={`/workspaces/${workspaceId}/requests/${request.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {request.title}
                    </Link>
                    <p className="text-sm font-medium">{request.status}</p>
                  </div>

                  {request.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {request.description}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Request ID: {request.id}
                    </p>
                    {request.status === RequestStatus.DRAFT ? (
                      <SubmitRequestForm requestId={request.id} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
