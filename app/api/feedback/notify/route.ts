/**
 * POST /api/feedback/notify — email new feedback to the Poke Companion inbox.
 *
 * Called by the feedback form after a successful Supabase insert. Sends a
 * plain-text notification via Resend so the feedback inbox (monitored daily)
 * receives every submission. Requires RESEND_API_KEY in the environment;
 * if unset, the route no-ops gracefully so feedback submission never breaks.
 */

import { Resend } from "resend";

export const dynamic = "force-dynamic";

const FEEDBACK_INBOX = "poke-companion@gigabytelife.net";
const MAX_MESSAGE = 5000;

interface NotifyBody {
  type?: string;
  message?: string;
  trainer_name?: string | null;
}

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Email not configured — feedback is still saved in Supabase.
    return Response.json({ emailed: false, reason: "not-configured" });
  }

  let body: NotifyBody;
  try {
    body = (await req.json()) as NotifyBody;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const message = (body.message ?? "").trim().slice(0, MAX_MESSAGE);
  if (!message) {
    return Response.json({ error: "Message is required." }, { status: 400 });
  }
  const type = (body.type ?? "feedback").trim() || "feedback";
  const trainer = (body.trainer_name ?? "").trim();

  const resend = new Resend(apiKey);
  try {
    const { error } = await resend.emails.send({
      from: "Poke Companion <onboarding@resend.dev>",
      to: FEEDBACK_INBOX,
      subject: `New ${type} feedback${trainer ? ` from ${trainer}` : ""}`,
      text: [
        `New feedback submitted on poke-companion.gigabytelife.net`,
        ``,
        `Type: ${type}`,
        trainer ? `Trainer: ${trainer}` : null,
        ``,
        message,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    });
    if (error) {
      console.error("Resend error:", error);
      return Response.json({ emailed: false, reason: "send-failed" }, { status: 502 });
    }
    return Response.json({ emailed: true });
  } catch (err) {
    console.error("Feedback notify failed:", err);
    return Response.json({ emailed: false, reason: "send-failed" }, { status: 502 });
  }
}
