import { getWindowTimeBRT, normalize } from './_lib/utils';
import { fetchFifaMatches, fetchFifaMatchTimeline } from './_lib/fifaApi';
import { getPendingMatches, updateMatchResult } from './_lib/dbService';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // 1. Autorização
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const apiKey = process.env.API_PASSWORD;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Montar Janela de Tempo
    const { fromDate, toDate } = getWindowTimeBRT();

    // 3. Buscar jogos pendentes no banco local
    const jogosPendentes = await getPendingMatches(fromDate, toDate);

    if (jogosPendentes.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Nenhum jogo pendente para atualizar no momento." 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Buscar dados atualizados na FIFA (Scrape)
    const matchesFifa = await fetchFifaMatches(fromDate, toDate);

    if (matchesFifa.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Nenhum jogo retornado pela API da FIFA para essa janela de tempo." 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. Match e Atualização
    let atualizados = 0;
    const detalhesAtualizacao = [];

    for (const jogoLocal of jogosPendentes) {
      const mandanteStr = normalize(jogoLocal.mandante);
      const visitanteStr = normalize(jogoLocal.visitante);

      const matchFifa = matchesFifa.find((m: any) => {
        const homeFifa = normalize(m.Home?.TeamName?.[0]?.Description || "");
        const awayFifa = normalize(m.Away?.TeamName?.[0]?.Description || "");
        
        const matchHome = homeFifa.length > 0 && mandanteStr.length > 0 && (homeFifa.includes(mandanteStr) || mandanteStr.includes(homeFifa));
        const matchAway = awayFifa.length > 0 && visitanteStr.length > 0 && (awayFifa.includes(visitanteStr) || visitanteStr.includes(awayFifa));

        const matchHomeReverse = awayFifa.length > 0 && mandanteStr.length > 0 && (awayFifa.includes(mandanteStr) || mandanteStr.includes(awayFifa));
        const matchAwayReverse = homeFifa.length > 0 && visitanteStr.length > 0 && (homeFifa.includes(visitanteStr) || visitanteStr.includes(homeFifa));

        return (matchHome && matchAway) || (matchHomeReverse && matchAwayReverse);
      });

      if (matchFifa) {
        const statusFifa = matchFifa.MatchStatus;
        
        // Na API da FIFA: 1 = Scheduled (Não começou). Ignoramos se não tiver score.
        if (statusFifa === 1 || matchFifa.Home?.Score === null || matchFifa.Home?.Score === undefined) {
          continue;
        }

        const homeScore = matchFifa.Home?.Score ?? 0;
        const awayScore = matchFifa.Away?.Score ?? 0;
        
        // Determinar se o jogo terminou (Geralmente 4 ou 0 é Finished)
        const isFinished = (statusFifa === 4 || statusFifa === 0);

        // Determinar se o jogo está rolando (Ao Vivo) - Status 3
        const isLive = statusFifa === 3;
        let timelineData = null;

        if ((isLive || isFinished) && matchFifa.IdMatch) {
          timelineData = await fetchFifaMatchTimeline(matchFifa.IdMatch);
        }
        
        const homePenalty = matchFifa.HomeTeamPenaltyScore ?? null;
        const awayPenalty = matchFifa.AwayTeamPenaltyScore ?? null;

        // Atualiza ou insere o placar atual na base
        const { error: upsertError } = await updateMatchResult(jogoLocal.id, homeScore, awayScore, isFinished, timelineData, matchFifa.IdMatch, homePenalty, awayPenalty);

        if (!upsertError) {
          atualizados++;
          detalhesAtualizacao.push({
            jogo_id: jogoLocal.id,
            match: `${jogoLocal.mandante} x ${jogoLocal.visitante}`,
            novoPlacar: `${homeScore} - ${awayScore}`,
            statusFifa,
            finalizouAgora: isFinished
          });
        } else {
          console.error(`Erro ao atualizar jogo_id ${jogoLocal.id}:`, upsertError.message);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processamento concluído. Jogos pendentes locais: ${jogosPendentes.length}. Jogos atualizados: ${atualizados}.`,
      detalhes: detalhesAtualizacao
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erro no Cron:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
