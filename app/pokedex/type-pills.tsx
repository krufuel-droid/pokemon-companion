import { typeColor } from "@/lib/theme";

export function TypePills({ types }: { types: string[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {types.map((type) => (
        <span
          key={type}
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize text-white"
          style={{ backgroundColor: typeColor(type) }}
        >
          {type}
        </span>
      ))}
    </div>
  );
}
