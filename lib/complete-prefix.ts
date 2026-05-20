// Returns the next completion of `fullText` starting from after `query.length`,
// extending up to (and including) the next space or ':' boundary, or to the end
// of `fullText` if no boundary is found. Returns `null` if no advance is
// possible (query is already at or past the end of fullText, or completion
// would equal the current query).
export function completePrefix(query: string, fullText: string): string | null {
  const start = query.length;
  if (start >= fullText.length) return null;
  let boundary = -1;
  for (let i = start; i < fullText.length; i++) {
    const c = fullText[i];
    if (c === ' ' || c === ':') {
      boundary = i;
      break;
    }
  }
  const completion = boundary === -1 ? fullText : fullText.substring(0, boundary + 1);
  if (completion === query) return null;
  return completion;
}
