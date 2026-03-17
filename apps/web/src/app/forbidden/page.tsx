import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="p-6">
      <div className="mx-auto max-w-xl rounded-lg border p-6">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view this page or perform this action.
        </p>

        <div className="mt-6 flex gap-2">
          <Link
            href="/workspaces"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Back to workspaces
          </Link>

          <Link
            href="/"
            className="rounded-md border px-4 py-2 text-sm font-medium"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
