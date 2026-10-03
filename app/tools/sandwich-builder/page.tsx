"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CONDIMENTS,
  FILLINGS,
  MAX_CONDIMENTS,
  MAX_FILLINGS,
  POWER_META,
  calculateSandwich,
  type GrantedPower,
  type IngredientDef,
} from "@/lib/data/sandwich-builder";
import { typeColor } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { unlockAchievement } from "@/lib/achievements";

interface SavedRecipe {
  id: string;
  name: string;
  ingredients: { fillings: string[]; condiments: string[] };
  created_at: string;
}

function countOf(list: string[], name: string): number {
  return list.filter((n) => n === name).length;
}

function IngredientPicker({
  title,
  subtitle,
  ingredients,
  selected,
  max,
  onAdd,
  onRemove,
}: {
  title: string;
  subtitle: string;
  ingredients: IngredientDef[];
  selected: string[];
  max: number;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const atMax = selected.length >= max;
  return (
    <details className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <summary className="cursor-pointer list-none px-6 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">
          ▸
        </span>
        <span className="text-xl font-bold text-slate-700 dark:text-slate-200">
          {title}
        </span>
        <span className="ml-2 text-sm font-medium text-slate-400 dark:text-slate-500">
          {selected.length}/{max} · {subtitle}
        </span>
      </summary>
      <div className="grid grid-cols-2 gap-2 px-6 pb-6 sm:grid-cols-3">
        {ingredients.map((ing) => {
          const n = countOf(selected, ing.name);
          return (
            <div
              key={ing.name}
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ring-1 ${
                n > 0
                  ? "bg-emerald-50 ring-emerald-300 dark:bg-emerald-950 dark:ring-emerald-700"
                  : "bg-slate-50 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {ing.herba && <span className="mr-1">🌿</span>}
                {ing.name}
                {n > 1 && (
                  <span className="ml-1 rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-white">
                    ×{n}
                  </span>
                )}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {n > 0 && (
                  <button
                    type="button"
                    onClick={() => onRemove(ing.name)}
                    aria-label={`Remove one ${ing.name}`}
                    className="rounded-full bg-slate-200 px-2 py-0.5 text-sm font-bold text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    −
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onAdd(ing.name)}
                  disabled={atMax}
                  aria-label={`Add ${ing.name}`}
                  className="rounded-full bg-emerald-500 px-2 py-0.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function PowerChip({ granted }: { granted: GrantedPower }) {
  const meta = POWER_META[granted.power];
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <span className="text-3xl">{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
          {meta.name}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {granted.type && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: typeColor(granted.type) }}
            >
              {granted.type}
            </span>
          )}
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            Lv. {granted.level}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SandwichBuilderPage() {
  const [fillings, setFillings] = useState<string[]>([]);
  const [condiments, setCondiments] = useState<string[]>([]);
  const [recipeName, setRecipeName] = useState("");
  const [saved, setSaved] = useState<SavedRecipe[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user?: { id?: string } | null } }) => {
        const uid = data.user?.id ?? null;
        userIdRef.current = uid;
        setSignedIn(Boolean(uid));
        if (uid) {
          createClient()
            .from("sandwich_recipes")
            .select("id, name, ingredients, created_at")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .then(({ data: rows }: { data: unknown }) => {
              setSaved((rows as SavedRecipe[] | null) ?? []);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const result = useMemo(
    () => calculateSandwich(fillings, condiments),
    [fillings, condiments],
  );

  const addFilling = (name: string) =>
    setFillings((prev) =>
      prev.length < MAX_FILLINGS ? [...prev, name] : prev,
    );
  const removeFilling = (name: string) =>
    setFillings((prev) => {
      const i = prev.indexOf(name);
      return i === -1 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)];
    });
  const addCondiment = (name: string) =>
    setCondiments((prev) =>
      prev.length < MAX_CONDIMENTS ? [...prev, name] : prev,
    );
  const removeCondiment = (name: string) =>
    setCondiments((prev) => {
      const i = prev.indexOf(name);
      return i === -1 ? prev : [...prev.slice(0, i), ...prev.slice(i + 1)];
    });

  const clearAll = () => {
    setFillings([]);
    setCondiments([]);
  };

  const saveRecipe = async () => {
    const uid = userIdRef.current;
    if (!uid) {
      setNotice("Sign in to save recipes to your account.");
      return;
    }
    if (!recipeName.trim()) {
      setNotice("Give your recipe a name first.");
      return;
    }
    if (fillings.length === 0 && condiments.length === 0) {
      setNotice("Add at least one ingredient first.");
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const { data, error } = await createClient()
        .from("sandwich_recipes")
        .insert({
          user_id: uid,
          name: recipeName.trim(),
          ingredients: { fillings, condiments },
        })
        .select("id, name, ingredients, created_at")
        .single();
      if (error) throw error;
      setSaved((prev) => [data as SavedRecipe, ...prev]);
      setRecipeName("");
      const unlocked = await unlockAchievement(uid, "first-sandwich").catch(
        () => false,
      );
      setNotice(
        unlocked
          ? "Recipe saved! Achievement unlocked: 🥪 Sandwich Chef"
          : "Recipe saved!",
      );
    } catch {
      setNotice(
        "Couldn't save — the sandwich_recipes table may not be migrated yet.",
      );
    } finally {
      setSaving(false);
    }
  };

  const loadRecipe = (r: SavedRecipe) => {
    setFillings(r.ingredients.fillings ?? []);
    setCondiments(r.ingredients.condiments ?? []);
    setNotice(`Loaded "${r.name}".`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteRecipe = async (id: string) => {
    if (!window.confirm("Delete this recipe?")) return;
    try {
      const { error } = await createClient()
        .from("sandwich_recipes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setSaved((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setNotice("Couldn't delete that recipe.");
    }
  };

  const hasIngredients = fillings.length > 0 || condiments.length > 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link
        href="/tools"
        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
      >
        ← All tools
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Scarlet &amp; Violet
      </p>
      <h1 className="mt-1 text-3xl font-bold text-slate-800 dark:text-slate-100">
        Sandwich Builder
      </h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        Pick real in-game fillings and condiments — see the exact meal powers
        your sandwich grants before you make it.
      </p>

      {/* Active powers at a glance */}
      <section className="mt-8 rounded-2xl bg-emerald-50 p-6 dark:bg-emerald-950">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Meal powers
        </h2>
        {result.powers.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Add ingredients below to see your sandwich&apos;s powers.
          </p>
        ) : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {result.powers.map((p) => (
                <PowerChip key={p.power} granted={p} />
              ))}
            </div>
            {result.herbaCount >= 2 && (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                🌿 Two or more Herba Mystica guarantee Sparkling Power — every
                power is Lv. 3.
              </p>
            )}
          </>
        )}
      </section>

      {/* Current sandwich */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Your sandwich{" "}
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
              {fillings.length}/{MAX_FILLINGS} fillings · {condiments.length}/
              {MAX_CONDIMENTS} condiments
            </span>
          </h2>
          {hasIngredients && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear all
            </button>
          )}
        </div>
        {!hasIngredients ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Nothing on the bread yet — open the Fillings or Condiments lists
            below.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {fillings.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {[...new Set(fillings)].map((name) => (
                  <button
                    key={`f-${name}`}
                    type="button"
                    onClick={() => removeFilling(name)}
                    title="Remove one"
                    className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
                  >
                    {name}
                    {countOf(fillings, name) > 1 &&
                      ` ×${countOf(fillings, name)}`}{" "}
                    ✕
                  </button>
                ))}
              </div>
            )}
            {condiments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {[...new Set(condiments)].map((name) => (
                  <button
                    key={`c-${name}`}
                    type="button"
                    onClick={() => removeCondiment(name)}
                    title="Remove one"
                    className="rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-900 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-100 dark:hover:bg-sky-800"
                  >
                    {name}
                    {countOf(condiments, name) > 1 &&
                      ` ×${countOf(condiments, name)}`}{" "}
                    ✕
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="mt-6 space-y-4">
        <IngredientPicker
          title="Fillings"
          subtitle="tap + to stack up to 6"
          ingredients={FILLINGS}
          selected={fillings}
          max={MAX_FILLINGS}
          onAdd={addFilling}
          onRemove={removeFilling}
        />
        <IngredientPicker
          title="Condiments"
          subtitle="tap + to stack up to 4"
          ingredients={CONDIMENTS}
          selected={condiments}
          max={MAX_CONDIMENTS}
          onAdd={addCondiment}
          onRemove={removeCondiment}
        />
      </div>

      {/* How it's calculated */}
      {hasIngredients && (
        <details className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <summary className="cursor-pointer list-none px-6 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="mr-2 inline-block transition-transform duration-200 [details[open]_&]:rotate-90">
              ▸
            </span>
            <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
              Why these powers?
            </span>
          </summary>
          <div className="space-y-4 px-6 pb-6 text-sm text-slate-600 dark:text-slate-400">
            {result.flavorBonus && (
              <p>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Flavor bonus:
                </span>{" "}
                {result.flavorBonus}
              </p>
            )}
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Power scores
              </p>
              <ul className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
                {result.powerScores
                  .filter((s) => s.value !== 0)
                  .map((s) => (
                    <li key={s.power}>
                      {POWER_META[s.power].icon} {POWER_META[s.power].name}:{" "}
                      <span className="font-mono">{s.value}</span>
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Top type scores
              </p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {result.typeScores.slice(0, 6).map((t) => (
                  <li key={t.type}>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                      style={{ backgroundColor: typeColor(t.type) }}
                    >
                      {t.type} {t.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Calculated from datamined ingredient values using the documented
              sandwich formula — the three strongest powers and types win, with
              documented tie-breaks.
            </p>
          </div>
        </details>
      )}

      {/* Save recipe */}
      <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Save this recipe
        </h2>
        {signedIn ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Name it… (e.g. Shiny Dragon hunt)"
              maxLength={80}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={saveRecipe}
              disabled={saving}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save recipe"}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            <Link
              href="/login"
              className="font-semibold text-emerald-600 dark:text-emerald-400"
            >
              Sign in
            </Link>{" "}
            to save favorite recipes to your account.
          </p>
        )}
        {notice && (
          <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {notice}
          </p>
        )}
      </section>

      {/* Saved recipes */}
      {signedIn && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            My recipes{" "}
            <span className="text-sm font-medium text-slate-400 dark:text-slate-500">
              {saved.length}
            </span>
          </h2>
          {saved.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              No saved recipes yet — build something tasty above.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {saved.map((r) => {
                const preview = [
                  ...(r.ingredients.fillings ?? []),
                  ...(r.ingredients.condiments ?? []),
                ]
                  .slice(0, 4)
                  .join(", ");
                return (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-100">
                      {r.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                      {preview}
                      {[
                        ...(r.ingredients.fillings ?? []),
                        ...(r.ingredients.condiments ?? []),
                      ].length > 4 && "…"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => loadRecipe(r)}
                        className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100 dark:hover:bg-emerald-800"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRecipe(r.id)}
                        className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <p className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Meal powers last 30 minutes in-game. Sparkling Power needs two Herba
        Mystica (5★+ Tera Raids).
      </p>
    </div>
  );
}
