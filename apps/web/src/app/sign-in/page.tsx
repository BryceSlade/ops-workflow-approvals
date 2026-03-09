import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form
        action={async () => {
          "use server";
          await signIn("github", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Sign in with GitHub
        </button>
      </form>
    </div>
  );
}
