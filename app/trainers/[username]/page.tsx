import { redirect } from "next/navigation";

/**
 * Legacy route — the canonical trainer profile lives at /trainer/[username]
 * (the rich flex-sheet page). This kept route exists only so old links keep
 * working; it redirects to the canonical one.
 */
export default async function LegacyTrainerRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(`/trainer/${encodeURIComponent(username)}`);
}
