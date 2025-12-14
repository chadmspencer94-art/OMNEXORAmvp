import { redirect, notFound } from "next/navigation";
import { requireActiveUser, isAdmin } from "@/lib/auth";
import { getUserVerification } from "@/lib/verification";
import { getPrisma } from "@/lib/prisma";
import VerificationDetailView from "./VerificationDetailView";

// Admin route uses cookies() via requireActiveUser and Prisma - must be dynamic
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AdminVerificationDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminVerificationDetailPage({ params }: AdminVerificationDetailPageProps) {
  const { userId } = await params;
  const user = await requireActiveUser(`/admin/verification/${userId}`);

  if (!isAdmin(user)) {
    redirect("/admin/verification");
  }

  // Get verification record
  const verification = await getUserVerification(userId);
  if (!verification) {
    notFound();
  }

  // Get user details
  const prisma = getPrisma();
  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!userRecord) {
    notFound();
  }

  return <VerificationDetailView verification={verification} user={userRecord} adminUserId={user.id} />;
}

