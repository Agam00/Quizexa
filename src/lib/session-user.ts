import { prisma } from "@/lib/db";
import type { Session } from "next-auth";

export async function getSessionUserId(
  session: Session
): Promise<string | null> {
  if (session.user.id) {
    const userById = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (userById) {
      return userById.id;
    }
  }

  if (session.user.email) {
    const userByEmail = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: { id: true },
    });

    return userByEmail?.id ?? null;
  }

  return null;
}
