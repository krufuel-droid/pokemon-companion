"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

/** Live count of unread messages for the current user. */
export function useUnreadCount(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    async function fetchCount() {
      try {
        const { count: c } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", user!.id)
          .is("read_at", null);
        if (!cancelled) setCount(c ?? 0);
      } catch {
        // table/column may not exist yet — stay at 0
      }
    }

    void fetchCount();

    // Live updates when new messages arrive or are read.
    const channel = supabase
      .channel(`unread:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => void fetchCount(),
      )
      .subscribe();

    // Refresh when the tab regains focus.
    const onFocus = () => void fetchCount();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
}
