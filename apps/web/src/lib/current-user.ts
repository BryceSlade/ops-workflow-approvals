import { auth } from "@/auth";

export type CurrentAppUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function requireCurrentUser(): Promise<CurrentAppUser> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    throw new Error("Unauthorized");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
  };
}
