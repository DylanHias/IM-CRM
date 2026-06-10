// Pure ranking for the help-doc context Iris injects per message. Scores each section
// by how many of its keywords appear in the message, returns the best-matching sections
// first, and caps both the count and total size so the injected docs can't overflow the
// model's context window and silently truncate the grounding rules. (B11)
export interface RankableSection {
  keywords: string[];
  content: string;
}

export function rankHelpSections<T extends RankableSection>(
  sections: T[],
  userMessage: string,
  maxSections: number,
  maxChars: number,
): T[] {
  const lower = userMessage.toLowerCase();
  const matched = sections
    .map((section) => ({
      section,
      score: section.keywords.reduce((n, kw) => (lower.includes(kw) ? n + 1 : n), 0),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.section);

  const ranked = matched.length > 0 ? matched : sections.slice(0, 2);

  const chosen: T[] = [];
  let used = 0;
  for (const section of ranked.slice(0, maxSections)) {
    if (chosen.length > 0 && used + section.content.length > maxChars) break;
    chosen.push(section);
    used += section.content.length;
  }
  return chosen;
}
