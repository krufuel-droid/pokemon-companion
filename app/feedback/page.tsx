import type { Metadata } from "next";
import { FeedbackForm, type FeedbackType } from "./feedback-form";

export const metadata: Metadata = {
  title: "Feedback | Poké Companion",
  description:
    "Report a bug, suggest a feature, or just say hi to the Poké Companion team.",
};

const VALID_TYPES: FeedbackType[] = ["bug", "idea", "hello"];

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  // Deep links like /feedback?type=bug preselect the matching form type;
  // anything else (or nothing) falls back to the form's default.
  const initialType = VALID_TYPES.includes(params.type as FeedbackType)
    ? (params.type as FeedbackType)
    : undefined;
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feedback</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Spotted a bug? Dreamed up a feature? Just want to say hi? We&apos;d
        love to hear it.
      </p>
      <div className="mt-6">
        <FeedbackForm initialType={initialType} />
      </div>
    </div>
  );
}
