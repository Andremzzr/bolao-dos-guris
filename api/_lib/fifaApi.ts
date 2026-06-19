export interface FifaMatch {
  MatchStatus: number;
  Home?: {
    TeamName?: { Description: string }[];
    Score?: number | null;
  };
  Away?: {
    TeamName?: { Description: string }[];
    Score?: number | null;
  };
}

/**
 * Busca a lista de partidas na API da FIFA para uma determinada janela de tempo
 */
export async function fetchFifaMatches(fromDate: string, toDate: string): Promise<FifaMatch[]> {
  const fifaCalendarUrl = `https://api.fifa.com/api/v3/calendar/matches?from=${fromDate}&to=${toDate}&language=pt&IdCompetition=17`;
  const responseFifa = await fetch(fifaCalendarUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    }
  });

  if (!responseFifa.ok) {
    throw new Error(`Falha ao buscar calendário da FIFA: Status ${responseFifa.status}`);
  }

  const dataFifa = await responseFifa.json();
  return dataFifa.Results || [];
}
