export interface FifaMatch {
  MatchStatus: number;
  IdMatch?: string;
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
  return dataFifa?.Results || [];
}

/**
 * Busca a timeline de um jogo específico na API da FIFA
 */
export async function fetchFifaMatchTimeline(idMatch: string): Promise<any> {
  const url = `https://api.fifa.com/api/v3/timelines/${idMatch}?language=pt`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar timeline do jogo ${idMatch}:`, error);
    return null;
  }
}

/**
 * Busca as estatísticas por time na API da FIFA FDH
 */
export async function fetchFifaTeamStats(idMatch: string): Promise<any> {
  const url = `https://fdh-api.fifa.com/v1/stats/match/${idMatch}/teams.json`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar team stats do jogo ${idMatch}:`, error);
    return null;
  }
}

/**
 * Busca as estatísticas por jogador na API da FIFA FDH
 */
export async function fetchFifaPlayerStats(idMatch: string): Promise<any> {
  const url = `https://fdh-api.fifa.com/v1/stats/match/${idMatch}/players.json`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar player stats do jogo ${idMatch}:`, error);
    return null;
  }
}

/**
 * Busca o Power Ranking na API da FIFA FDH
 */
export async function fetchFifaPowerRanking(idMatch: string): Promise<any> {
  const url = `https://fdh-api.fifa.com/v1/powerranking/match/${idMatch}.json`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar power ranking do jogo ${idMatch}:`, error);
    return null;
  }
}
