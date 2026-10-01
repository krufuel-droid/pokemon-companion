/**
 * Small circular trainer avatar with a mint initial fallback,
 * matching the public trainer pages.
 */
export default function Avatar({
  username,
  avatarUrl,
  size = 40,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${username}'s avatar`}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover ring-1 ring-stone-200 dark:ring-slate-700"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-mint font-bold text-slate-900 dark:text-slate-100"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {username.charAt(0).toUpperCase()}
    </span>
  );
}
