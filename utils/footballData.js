// calls the football-data API with the provided path and returns the JSON response, throwing an error if the request fails
export async function fdGet(path) {
    if (!process.env.FOOTBALL_DATA_API_KEY) {
      throw new Error("FOOTBALL_DATA_API_KEY not set");
    }
  
    const res = await fetch(`https://api.football-data.org/v4${path}`, {
      headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY },
      cache: "no-store",
    });
  
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`football-data error ${res.status}: ${text}`);
    }
  
    return res.json();
}