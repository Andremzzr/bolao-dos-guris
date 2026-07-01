import { createClient } from '@supabase/supabase-js';

// Inicialização "lazy" para garantir que pegamos do process.env no momento da execução na Vercel
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase URL ou Key não configuradas no ambiente.");
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
};

export interface JogoPendente {
  id: number;
  mandante: string;
  visitante: string;
  data: string;
}

/**
 * Retorna os jogos do banco de dados que caem na janela de tempo informada e que ainda não terminaram.
 */
export async function getPendingMatches(fromDate: string, toDate: string): Promise<JogoPendente[]> {
  const supabase = getSupabase();
  
  // 1. Fetch jogos
  const { data: jogosDoDia, error: errorJogos } = await supabase
    .from('jogos')
    .select(`
      id, 
      mandante, 
      visitante, 
      data
    `)
    .gte('data', fromDate)
    .lte('data', toDate);

  if (errorJogos) {
    throw new Error(`Erro ao buscar jogos no Supabase: ${errorJogos.message}`);
  }

  if (!jogosDoDia || jogosDoDia.length === 0) {
    return [];
  }

  // 2. Fetch resultados para os jogos encontrados
  const jogoIds = jogosDoDia.map((j: any) => j.id);
  const { data: resultadosData, error: errorResultados } = await supabase
    .from('resultados')
    .select('jogo_id, finalizado, gols_mandante, gols_visitante')
    .in('jogo_id', jogoIds);

  if (errorResultados) {
    throw new Error(`Erro ao buscar resultados no Supabase: ${errorResultados.message}`);
  }

  const resultadosMap = (resultadosData || []).reduce((acc: any, r: any) => {
    acc[r.jogo_id] = r;
    return acc;
  }, {});

  // 3. Filtrar apenas os jogos que ainda não estão finalizados
  const jogosPendentes = jogosDoDia.filter((j: any) => {
    const resultadoInfo = resultadosMap[j.id];
    return resultadoInfo?.finalizado !== true;
  });

  return jogosPendentes as JogoPendente[];
}

/**
 * Atualiza (upsert) o resultado de um jogo na base
 */
export async function updateMatchResult(
  jogoId: number, 
  homeScore: number, 
  awayScore: number, 
  isFinished: boolean, 
  timeline: any = null, 
  fifaMatchId: string | null = null, 
  homePenaltyScore: number | null = null, 
  awayPenaltyScore: number | null = null, 
  mvpPlayerId: string | null = null,
  teamStats: any = null,
  playerStats: any = null,
  powerRankings: any = null
) {
  const supabase = getSupabase();
  const payload: any = {
      jogo_id: jogoId,
      gols_mandante: homeScore,
      gols_visitante: awayScore,
      finalizado: isFinished,
      fifa_match_id: fifaMatchId,
      penaltis_mandante: homePenaltyScore,
      penaltis_visitante: awayPenaltyScore
  };

  if (timeline !== null) {
      payload.timeline = timeline;
  }
  if (mvpPlayerId !== null) {
      payload.mvp_player_id = mvpPlayerId;
  }
  if (teamStats !== null) {
      payload.team_stats = teamStats;
  }
  if (playerStats !== null) {
      payload.player_stats = playerStats;
  }
  if (powerRankings !== null) {
      payload.power_rankings = powerRankings;
  }

  return await supabase
    .from('resultados')
    .upsert(payload);
}
