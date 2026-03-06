export const NO_EFFECT_MESSAGES = [
  "The potion yawns and goes back to sleep.",
  "The lab politely declines this experiment.",
  "Science looked at that and took a coffee break.",
  "Your beakers made eye contact and did nothing.",
  "A dramatic fizz was scheduled, then canceled.",
  "The universe says: nice try, alchemist.",
  "The ingredients filed a motion to remain separate.",
  "A tiny goblin shook its head and vanished.",
  "That combo has the charisma of wet cardboard.",
  "Your reaction produced premium-grade disappointment.",
];

export const NO_DISCOVERIES_LEFT_MESSAGE =
  "No new combinations are currently possible with discovered elements.";

export function formatHintText(hint) {
  return `Hint: try ${hint.first} + ${hint.second}.`;
}
