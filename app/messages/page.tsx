"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useAuth } from "@/components/AuthProvider";
import SupabaseNeeded from "@/components/SupabaseNeeded";
import Avatar from "@/components/Avatar";
import CommunityTabs from "@/components/CommunityTabs";
import {
  MAX_MESSAGE_LENGTH,
  timeAgo,
  type DirectMessage,
  type FriendProfile,
  type Friendship,
} from "@/lib/community";

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8";
const inputClass =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/40";

const POLL_MS = 15000;

interface Conversation {
  friend: FriendProfile;
  lastMessage: DirectMessage | null;
}

export default function MessagesPage() {
  const { configured, loading, user } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const friendIds = new Set(friends.map((f) => f.id));
  const selectedFriend = friends.find((f) => f.id === selectedId) ?? null;

  /** Pure fetch: accepted friends only — DMs are restricted to mutual friends. */
  const fetchFriends = useCallback(async (): Promise<FriendProfile[]> => {
    if (!user) return [];
    const supabase = createClient();
    const { data, error } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status, created_at")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted");
    if (error) throw new Error(error.message);
    const rows = (data as Friendship[]) ?? [];
    const otherIds = [
      ...new Set(
        rows.map((r) => (r.requester_id === user.id ? r.addressee_id : r.requester_id)),
      ),
    ];
    if (otherIds.length === 0) return [];
    const { data: profData, error: profError } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", otherIds);
    if (profError) throw new Error(profError.message);
    return (profData as FriendProfile[]) ?? [];
  }, [user]);

  /** Pure fetch: one conversation entry per friend with its latest message. */
  const fetchConversations = useCallback(
    async (friendList: FriendProfile[]): Promise<Conversation[]> => {
      if (!user) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, body, created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw new Error(error.message);
      const all = (data as DirectMessage[]) ?? [];
      const latest = new Map<string, DirectMessage>();
      for (const m of all) {
        const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!latest.has(other)) latest.set(other, m);
      }
      const convos: Conversation[] = friendList.map((f) => ({
        friend: f,
        lastMessage: latest.get(f.id) ?? null,
      }));
      convos.sort((a, b) =>
        (b.lastMessage?.created_at ?? "").localeCompare(a.lastMessage?.created_at ?? ""),
      );
      return convos;
    },
    [user],
  );

  /** Pure fetch: the message thread with one friend, oldest first. */
  const fetchThread = useCallback(
    async (friendId: string): Promise<DirectMessage[]> => {
      if (!user) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, receiver_id, body, created_at")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`,
        )
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw new Error(error.message);
      return (data as DirectMessage[]) ?? [];
    },
    [user],
  );

  // Initial load once auth is ready. State updates happen in promise
  // continuations (after the network round-trips), never synchronously.
  useEffect(() => {
    if (!configured || loading || !user) return;
    let cancelled = false;
    void (async () => {
      const friendList = await fetchFriends();
      if (cancelled) return;
      const convos = await fetchConversations(friendList);
      if (cancelled) return;
      setFriends(friendList);
      setConversations(convos);
      setLoadingList(false);
    })().catch((e: unknown) =>
      console.error("Failed to load conversations:", e instanceof Error ? e.message : e),
    );
    return () => {
      cancelled = true;
    };
  }, [configured, loading, user, fetchFriends, fetchConversations]);

  // Load the thread when a conversation is selected.
  useEffect(() => {
    if (!selectedId || !user) return;
    let cancelled = false;
    void fetchThread(selectedId)
      .then((rows) => {
        if (cancelled) return;
        setMessages(rows);
        setLoadingThread(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadingThread(false);
        console.error("Failed to load thread:", e instanceof Error ? e.message : e);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, user, fetchThread]);

  // Keep the polling loop pointed at the current selection without
  // resetting the interval on every selection change.
  const selectedRef = useRef<string | null>(null);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  // Poll for new messages while the page is open.
  useEffect(() => {
    if (!configured || loading || !user) return;
    const id = setInterval(() => {
      const current = selectedRef.current;
      if (current) {
        void fetchThread(current)
          .then(setMessages)
          .catch(() => {});
      }
      void fetchFriends()
        .then((friendList) =>
          fetchConversations(friendList).then((convos) => {
            setFriends(friendList);
            setConversations(convos);
          }),
        )
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [configured, loading, user, fetchThread, fetchFriends, fetchConversations]);

  // Scroll to the newest message when the thread grows.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  function selectConversation(friendId: string) {
    setMessages([]);
    setLoadingThread(true);
    setSelectedId(friendId);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!user || !selectedId) return;
    const text = draft.trim();
    if (!text) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      setError(`Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    // Safety: only mutual friends can message each other.
    if (!friendIds.has(selectedId)) {
      setError("You can only message mutual friends.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedId,
        body: text,
      });
      if (error) {
        setError(error.message);
        return;
      }
      setDraft("");
      const rows = await fetchThread(selectedId);
      setMessages(rows);
      const friendList = await fetchFriends();
      setFriends(friendList);
      setConversations(await fetchConversations(friendList));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't send the message.");
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured() || !configured) return <SupabaseNeeded />;
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <div className={`${cardClass} text-center`}>
          <h1 className="text-xl font-bold text-slate-900">Messages need a sign-in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to chat with your friends.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Messages</h1>
      <p className="mb-6 text-sm text-slate-600">
        Private chats with your mutual friends. New messages arrive automatically.
      </p>
      <CommunityTabs />

      {loadingList ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading conversations…</p>
      ) : friends.length === 0 ? (
        <div className={`${cardClass} text-center`}>
          <p className="text-sm text-slate-600">
            No friends yet —{" "}
            <Link href="/friends" className="font-semibold underline underline-offset-2">
              add some friends
            </Link>{" "}
            to start chatting!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          {/* Conversation list */}
          <div
            className={`space-y-2 ${selectedId ? "hidden md:block" : ""}`}
            role="list"
            aria-label="Conversations"
          >
            {conversations.map((c) => (
              <button
                key={c.friend.id}
                type="button"
                role="listitem"
                onClick={() => selectConversation(c.friend.id)}
                aria-current={selectedId === c.friend.id ? "true" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  selectedId === c.friend.id
                    ? "border-mint bg-mint/10"
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <Avatar username={c.friend.username} avatarUrl={c.friend.avatar_url} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {c.friend.username}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {c.lastMessage
                      ? `${c.lastMessage.sender_id === user.id ? "You: " : ""}${c.lastMessage.body}`
                      : "No messages yet"}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* Thread */}
          <div className={selectedId ? "" : "hidden md:block"}>
            {!selectedFriend ? (
              <div className={`${cardClass} text-center`}>
                <p className="text-sm text-slate-500">
                  Pick a conversation to start chatting.
                </p>
              </div>
            ) : (
              <div className="flex flex-col rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-stone-100 p-4">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-stone-100 md:hidden"
                  >
                    ← Back
                  </button>
                  <Avatar
                    username={selectedFriend.username}
                    avatarUrl={selectedFriend.avatar_url}
                    size={32}
                  />
                  <Link
                    href={`/trainers/${encodeURIComponent(selectedFriend.username)}`}
                    className="text-sm font-bold text-slate-900 hover:underline"
                  >
                    {selectedFriend.username}
                  </Link>
                </div>

                <div
                  className="max-h-[50vh] min-h-64 space-y-3 overflow-y-auto p-4"
                  aria-live="polite"
                  aria-label={`Messages with ${selectedFriend.username}`}
                >
                  {loadingThread && messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Loading messages…
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      Say hello to {selectedFriend.username}! 👋
                    </p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.sender_id === user.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              mine
                                ? "rounded-br-md bg-mint text-slate-900"
                                : "rounded-bl-md bg-stone-100 text-slate-800"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                            <p
                              className={`mt-1 text-right text-[11px] ${
                                mine ? "text-slate-700/70" : "text-slate-400"
                              }`}
                            >
                              {timeAgo(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={threadEndRef} />
                </div>

                <form onSubmit={(e) => void send(e)} className="border-t border-stone-100 p-4">
                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className={inputClass}
                      placeholder={`Message ${selectedFriend.username}…`}
                      maxLength={MAX_MESSAGE_LENGTH}
                      autoComplete="off"
                      aria-label="Message text"
                    />
                    <button
                      type="submit"
                      disabled={busy || draft.trim() === ""}
                      className="shrink-0 rounded-lg bg-mint px-5 py-2 text-sm font-bold text-slate-900 shadow-sm transition hover:brightness-95 disabled:opacity-60"
                    >
                      {busy ? "…" : "Send"}
                    </button>
                  </div>
                  {error && (
                    <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
