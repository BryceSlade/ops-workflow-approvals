import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">ops-workflow-approvals</h1>

      <div className="mt-4 space-y-1 text-sm">
        <p>Signed in as: {session.user.email}</p>
        <p>Database user id: {session.user.id}</p>
        <p>Name: {session.user.name ?? "No name set"}</p>
      </div>

      <div className="mt-6">
        <Link
          href="/workspaces"
          className="rounded-md border px-4 py-2 text-sm font-medium inline-block"
        >
          Go to workspaces
        </Link>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/sign-in" });
        }}
        className="mt-6"
      >
        <button
          type="submit"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
