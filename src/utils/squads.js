const squadCache = new Map();

export async function getTeamSquad(teamId) {
  if (!teamId) return [];
  if (squadCache.has(teamId)) {
    return squadCache.get(teamId);
  }
  
  const promise = fetch(`https://api.fifa.com/api/v3/teams/${teamId}/squad?idCompetition=17&idSeason=285023&language=pt`)
    .then(r => r.json())
    .then(data => data.Players || [])
    .catch(err => {
      console.error(`Failed to fetch squad for team ${teamId}`, err);
      return [];
    });
    
  squadCache.set(teamId, promise);
  return promise;
}
