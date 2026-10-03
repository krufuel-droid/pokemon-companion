import TeamBuilder from "./team-builder";

export const metadata = {
  title: "Team Builder | Poke Companion",
  description:
    "Draft a 6-Pokémon team, check defensive weaknesses and offensive type coverage, save teams, and share them with a link.",
};

export default function TeamBuilderPage() {
  return <TeamBuilder />;
}
