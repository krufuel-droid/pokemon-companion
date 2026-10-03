/**
 * Small circular trainer avatar with a mint initial fallback,
 * matching the public trainer pages.
 */
export default function Avatar({
  username,
  avatarUrl,
  size = 40,
  online = false,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
  /** Show a green "online" dot (last_seen within 5 minutes). */
  online?: boolean;
}) {
  const inner = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={`${username}'s avatar`}
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover ring-1 ring-stone-200 dark:ring-slate-700"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-mint font-bold text-slate-900 dark:text-slate-100"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {inner}
      {online && (
        <span
          role="img"
          aria-label="Online"
          title="Online"
          className="absolute bottom-0 right-0 block rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"
          style={{
            width: Math.max(10, Math.round(size * 0.3)),
            height: Math.max(10, Math.round(size * 0.3)),
          }}
        />
      )}
    </span>
  );
}
