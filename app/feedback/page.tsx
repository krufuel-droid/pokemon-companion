import type { Metadata } from "next";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = {
  title: "Feedback | Poke Companion",
  description:
    "Report a bug, suggest a feature, or just say hi to the Poke Companion team.",
};

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Feedback</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Spotted a bug? Dreamed up a feature? Just want to say hi? We&apos;d
        love to hear it.
      </p>
      <div className="mt-6">
        <FeedbackForm />
      </div>
    </div>
  );
}
