export interface TopScore {
  name: string
  score: number
}

export async function fetchTopScore(): Promise<TopScore> {
  const response = await fetch('/ch08/top-score.json')
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  // Trusts the server. Chapter 11 shows how to check untrusted data.
  return (await response.json()) as TopScore
}
