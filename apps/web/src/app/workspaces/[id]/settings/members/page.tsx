import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  requireWorkspaceMember,
  isWorkspaceAdminRole,
} from "@/features/workspaces/server/permissions";
import {
  listWorkspaceMembers,
  type WorkspaceMemberListItem,
} from "@/features/workspaces/server/list-workspace-members";
import { AddMemberForm } from "@/features/workspaces/components/add-member-form";
import { ChangeRoleForm } from "@/features/workspaces/components/change-role-form";

type MembersPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WorkspaceMembersPage({
  params,
}: MembersPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { id: workspaceId } = await params;
  const membership = await requireWorkspaceMember(workspaceId);

  if (!isWorkspaceAdminRole(membership.role)) {
    redirect("/forbidden");
  }

  const members = await listWorkspaceMembers(workspaceId);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Workspace Members</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage membership and roles for this workspace.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Workspace ID: {workspaceId}
          </p>
        </div>

        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Add member</h2>
          <AddMemberForm workspaceId={workspaceId} />
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Current members</h2>

          {members.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No members found.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {members.map((member: WorkspaceMemberListItem) => (
                <div key={member.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">
                        {member.user.name ?? member.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                    <ChangeRoleForm
                      workspaceId={workspaceId}
                      memberId={member.id}
                      currentRole={member.role}
                    />
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    Member ID: {member.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
