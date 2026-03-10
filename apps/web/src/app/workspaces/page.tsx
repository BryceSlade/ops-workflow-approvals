import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createWorkspace } from "@/features/workspaces/server/create-workspace";
import {
  listMyWorkspaces,
  type WorkspaceListItem,
} from "@/features/workspaces/server/list-workspaces";

export default async function WorkspacesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const workspaces = await listMyWorkspaces();

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a workspace and start testing RBAC from there.
          </p>
        </div>

        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">Create workspace</h2>

          <form action={createWorkspace} className="mt-4 flex gap-3">
            <input
              type="text"
              name="name"
              placeholder="Acme Operations"
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              required
              maxLength={100}
            />
            <button
              type="submit"
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Create
            </button>
          </form>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="text-lg font-medium">My workspaces</h2>

          {workspaces.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No workspaces yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {workspaces.map((workspace: WorkspaceListItem) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Role: {workspace.members[0]?.role ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {workspace.id}
                    </p>
                  </div>

                  <Link
                    href={`/workspaces/${workspace.id}/settings/members`}
                    className="rounded-md border px-4 py-2 text-sm font-medium"
                  >
                    Manage members
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
