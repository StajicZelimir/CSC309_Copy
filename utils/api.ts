export async function fetchMatches() {
  const res = await fetch('/api/sports/matches');
  if (!res.ok) {
    throw new Error('Failed to fetch matches');
  }
  return res.json();
}

export async function fetchStandings() {
  const res = await fetch('/api/sports/standings');
  if (!res.ok) {
    throw new Error('Failed to fetch standings');
  }
  return res.json();
}