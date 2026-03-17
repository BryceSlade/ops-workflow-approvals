import Link from "next/link";
import { redirect } from "next/navigation";
import { RequestStatus } from "@prisma/client";
import { auth } from "@/auth";
import { getWorkspaceRequest } from "@/features/requests/server/get-workspace-request";
import {
  isRequestReviewerRole,
  requireRequestWorkspaceMember,
} from "@/features/requests/server/permissions";
import { UpdateRequestDraftForm } from "@/features/requests/components/update-request-draft-form";
import { SubmitRequestForm } from "@/features/requests/components/submit-request-form";
import { ReviewRequestActions } from "@/features/requests/components/review-request-actions";

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

  const membership = await (async () => {
    try {
      return await requireRequestWorkspaceMember(workspaceId);
    } catch {
      redirect("/forbidden");
    }
  })();

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

            <UpdateRequestDraftForm
              requestId={request.id}
              title={request.title}
              description={request.description}
            />

            <div className="mt-4">
              <SubmitRequestForm
                requestId={request.id}
                buttonLabel="Submit request"
              />
            </div>
          </section>
        ) : null}

        {canReview && request.status === RequestStatus.SUBMITTED ? (
          <section className="rounded-lg border p-4">
            <h2 className="text-lg font-medium">Review decision</h2>
            <div className="mt-4">
              <ReviewRequestActions requestId={request.id} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
