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
  const { data: jogosDoDia, error: errorJogos } = await supabase
    .from('jogo')
    .select(`
      id, 
      mandante, 
      visitante, 
      data, 
      resultado ( finalizado, gols_mandante, gols_visitante )
    `)
    .gte('data', fromDate)
    .lte('data', toDate);

  if (errorJogos) {
    throw new Error(`Erro ao buscar jogos no Supabase: ${errorJogos.message}`);
  }

  const jogosPendentes = jogosDoDia?.filter(j => {
    if (!j.resultado) return true;
    const resultadoInfo = Array.isArray(j.resultado) ? j.resultado[0] : j.resultado;
    return resultadoInfo?.finalizado !== true;
  }) || [];

  return jogosPendentes;
}

/**
 * Atualiza (upsert) o resultado de um jogo na base
 */
export async function updateMatchResult(jogoId: number, homeScore: number, awayScore: number, isFinished: boolean) {
  const supabase = getSupabase();
  return await supabase
    .from('resultado')
    .upsert({
      jogo_id: jogoId,
      gols_mandante: homeScore,
      gols_visitante: awayScore,
      finalizado: isFinished
    });
}
