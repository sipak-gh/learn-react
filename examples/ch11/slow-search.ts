const NAMES = ['Ada', 'Adele', 'Alan', 'Bo', 'Cy', 'Grace']

/** A pretend server. Short queries happen to be slow, so answers can arrive out of order. */
export function slowSearch(query: string): Promise<string[]> {
  const found = NAMES.filter((name) => name.toLowerCase().startsWith(query.toLowerCase()))
  const latency = Math.max(100, 1200 - 400 * query.length)
  return new Promise((resolve) => setTimeout(() => resolve(found), latency))
}
