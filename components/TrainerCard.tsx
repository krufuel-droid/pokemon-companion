import Avatar from "@/components/Avatar";

/**
 * TrainerCard — the shareable trainer card.
 *
 * Server-component friendly: all data arrives via props, so the public
 * trainer page can render it for logged-out visitors. Dark-mode clean,
 * compact enough to screenshot and share.
 */

export interface TrainerCardFavorite {
  species_id: number;
  species_name: string;
  sprite_url: string | null;
}

export interface TrainerCardAchievement {
  id: string;
  name: string;
  icon: string;
}

export interface TrainerCardProps {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  favorites: TrainerCardFavorite[];
  shinyCount: number;
  achievements: TrainerCardAchievement[];
  tcgCards: number;
  masterSetPrints: number;
  memberSince: string;
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 px-3 py-2 text-center backdrop-blur-sm">
      <div className="text-lg font-black tabular-nums text-white">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/80">
        {label}
      </div>
    </div>
  );
}

export default function TrainerCard({
  username,
  avatarUrl,
  bio,
  favorites,
  shinyCount,
  achievements,
  tcgCards,
  masterSetPrints,
  memberSince,
}: TrainerCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 shadow-xl ring-1 ring-emerald-900/20">
      {/* Header */}
      <div className="flex items-center gap-4 p-6">
        <Avatar username={username} avatarUrl={avatarUrl} size={72} />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100/80">
            🏅 Trainer Card
          </p>
          <h2 className="truncate text-2xl font-black text-white">{username}</h2>
          {bio && (
            <p className="mt-0.5 line-clamp-2 text-sm text-emerald-50/90">{bio}</p>
          )}
          <p className="mt-1 text-xs text-emerald-100/70">Training since {memberSince}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 px-6">
        <StatChip value={String(shinyCount)} label="✨ Shinies" />
        <StatChip value={String(achievements.length)} label="🏆 Honors" />
        <StatChip value={String(tcgCards)} label="🃏 TCG Cards" />
        <StatChip value={String(masterSetPrints)} label="🌍 Prints" />
      </div>

      {/* Favorite Pokémon */}
      {favorites.length > 0 && (
        <div className="px-6 pt-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100/80">
            Favorite Pokémon
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {favorites.map((f) => (
              <div
                key={f.species_id}
                title={f.species_name}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 p-1 backdrop-blur-sm"
              >
                {f.sprite_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.sprite_url}
                    alt={f.species_name}
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs font-bold text-white">{f.species_name.slice(0, 2)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent achievements */}
      {achievements.length > 0 && (
        <div className="px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100/80">
            Latest honors
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {achievements.slice(0, 8).map((a) => (
              <span
                key={a.id}
                title={a.name}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-xl backdrop-blur-sm"
              >
                {a.icon}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
