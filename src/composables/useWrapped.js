import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/composables/useAuth'

export function useWrapped() {
  const { user } = useAuth()
  const loading = ref(true)
  const error = ref(null)
  
  const wrappedData = ref({
    rankingData: null,
    stats: null, // Tela 2 nova
    zebrasPerdidas: [], // Tela 3
    favoriteMvp: null, // Tela 3
    favoriteTeams: [], // Tela 4
    zebraVencida: null, // Tela 5
    irmaosDeBolao: [], // Tela 6
    summary: null // Tela 7
  })

  async function fetchWrappedData() {
    if (!user.value) return

    loading.value = true
    error.value = null

    try {
      const userId = user.value.id

      // Fetch user ranking stats
      const { data: rankingData, error: rankingError } = await supabase
        .from('view_ranking')
        .select('*')
        .eq('usuario_id', userId)
        .single()

      if (rankingError) throw rankingError

      // Fetch palpites
      const { data: palpites, error: palpitesError } = await supabase
        .from('palpites')
        .select('*')
        .eq('usuario_id', userId)

      if (palpitesError) throw palpitesError

      // Fetch resultados (only finalized)
      const { data: resultados, error: resultadosError } = await supabase
        .from('resultados')
        .select('*')
        .eq('finalizado', true)

      if (resultadosError) throw resultadosError

      // Fetch view_odds
      const { data: odds, error: oddsError } = await supabase
        .from('view_odds')
        .select('*')

      if (oddsError) throw oddsError

      // Fetch ALL rankings (for irmaos de bolao avatars/names)
      const { data: allRanking, error: allRankingError } = await supabase
        .from('view_ranking')
        .select('usuario_id, nome, avatar_url')

      if (allRankingError) throw allRankingError

      // Fetch ALL palpites (for irmaos de bolao match)
      const { data: allPalpites, error: allPalpitesError } = await supabase
        .from('palpites')
        .select('usuario_id, jogo_id, gols_mandante, gols_visitante')

      if (allPalpitesError) throw allPalpitesError

      // Fetch jogos statically (as seen in useRanking.js)
      const { default: jogosData } = await import('@/data/jogos.json')

      // Process data for the screens
      
      // Map structures for easy access
      const resultadosMap = Object.fromEntries(resultados.map(r => [r.jogo_id, r]))
      const oddsMap = Object.fromEntries(odds.map(o => [o.jogo_id, o]))
      const jogosMap = Object.fromEntries(jogosData.map(j => [j.id, j]))

      // --- Tela 2: Zebra Perdida ---
      // User bet on the community favorite, but lost (got 0 points)
      let lostZebras = []

      for (const p of palpites) {
        const res = resultadosMap[p.jogo_id]
        if (!res) continue // Game not finished
        if (p.pontuacao > 0) continue // User got points, so they didn't lose

        const odd = oddsMap[p.jogo_id]
        if (!odd || odd.total_votos === 0) continue

        // What was the user's guess?
        let userGuessed = 'empate'
        if (p.gols_mandante > p.gols_visitante) userGuessed = 'mandante'
        else if (p.gols_mandante < p.gols_visitante) userGuessed = 'visitante'

        // How many votes did this guess get?
        const votesForGuess = odd[`votos_${userGuessed}`]
        
        // Was it the absolute favorite?
        const maxVotes = Math.max(odd.votos_mandante, odd.votos_visitante, odd.votos_empate)
        
        if (votesForGuess === maxVotes) {
          const percentage = votesForGuess / odd.total_votos
          lostZebras.push({
            jogo: jogosMap[p.jogo_id],
            palpite: p,
            resultado: res,
            percentage: Math.round(percentage * 100)
          })
        }
      }
      
      lostZebras.sort((a, b) => b.percentage - a.percentage)
      const zebrasPerdidas = lostZebras.slice(0, 3)
      
      // --- Tela 3: Jogador Favorito (MVP) ---
      const mvpCounts = {}
      for (const p of palpites) {
        if (p.mvp_player_name) {
          if (!mvpCounts[p.mvp_player_name]) {
            mvpCounts[p.mvp_player_name] = { count: 0, picture: p.mvp_player_picture }
          }
          mvpCounts[p.mvp_player_name].count++
        }
      }
      let topMvpName = null
      let maxMvpCount = 0
      let topMvpPicture = null
      for (const [name, data] of Object.entries(mvpCounts)) {
        if (data.count > maxMvpCount) {
          maxMvpCount = data.count
          topMvpName = name
          topMvpPicture = data.picture
        }
      }
      const favoriteMvp = topMvpName ? { name: topMvpName, count: maxMvpCount, picture: topMvpPicture } : null

      // --- Tela 4: Seleções Favoritas ---
      const teamCounts = {}
      for (const p of palpites) {
        const jogo = jogosMap[p.jogo_id]
        if (!jogo) continue
        
        if (p.gols_mandante > p.gols_visitante) {
          teamCounts[jogo.mandante] = (teamCounts[jogo.mandante] || 0) + 1
        } else if (p.gols_visitante > p.gols_mandante) {
          teamCounts[jogo.visitante] = (teamCounts[jogo.visitante] || 0) + 1
        }
      }
      
      const favoriteTeams = Object.entries(teamCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }))

      // --- Tela 5: Zebra Vencida ---
      // User scored > 0, and they bet on the least likely outcome or a very unlikely one
      let wonZebras = []

      for (const p of palpites) {
        const res = resultadosMap[p.jogo_id]
        if (!res || p.pontuacao === 0) continue // Only games user scored points

        const odd = oddsMap[p.jogo_id]
        if (!odd || odd.total_votos === 0) continue

        let userGuessed = 'empate'
        if (p.gols_mandante > p.gols_visitante) userGuessed = 'mandante'
        else if (p.gols_mandante < p.gols_visitante) userGuessed = 'visitante'

        const votesForGuess = odd[`votos_${userGuessed}`]
        const percentage = votesForGuess / odd.total_votos

        wonZebras.push({
          jogo: jogosMap[p.jogo_id],
          palpite: p,
          resultado: res,
          percentage: Math.round(percentage * 100)
        })
      }
      
      wonZebras.sort((a, b) => a.percentage - b.percentage)
      const zebraVencida = wonZebras.length > 0 ? wonZebras[0] : null

      // --- Tela 6: Irmãos de Bolão ---
      const userGuesses = {}
      for (const p of palpites) {
        userGuesses[p.jogo_id] = `${p.gols_mandante}x${p.gols_visitante}`
      }

      const matchCounts = {}
      if (allPalpites && allRanking) {
        for (const p of allPalpites) {
          if (p.usuario_id === userId) continue
          
          if (userGuesses[p.jogo_id] === `${p.gols_mandante}x${p.gols_visitante}`) {
            matchCounts[p.usuario_id] = (matchCounts[p.usuario_id] || 0) + 1
          }
        }
      }

      const irmaos = []
      for (const [uid, count] of Object.entries(matchCounts)) {
        const rankingUser = allRanking.find(r => r.usuario_id === uid)
        if (rankingUser) {
          irmaos.push({
            nome: rankingUser.nome,
            avatar: rankingUser.avatar_url,
            count
          })
        }
      }
      
      irmaos.sort((a, b) => b.count - a.count)
      const irmaosDeBolao = irmaos.slice(0, 3)

      // --- Tela Nova: Stats ---
      const finishedPalpites = palpites.filter(p => resultadosMap[p.jogo_id])
      
      // Sort by date
      finishedPalpites.sort((a, b) => {
        const dateA = new Date(jogosMap[a.jogo_id]?.data || 0)
        const dateB = new Date(jogosMap[b.jogo_id]?.data || 0)
        return dateA - dateB
      })

      let totalPalpites = finishedPalpites.length
      let totalAcertos = 0
      let totalErros = 0
      
      let currentAcertosStreak = 0
      let maxAcertosStreak = 0
      
      let currentErrosStreak = 0
      let maxErrosStreak = 0

      for (const p of finishedPalpites) {
        if (p.pontuacao > 0) {
          totalAcertos++
          currentAcertosStreak++
          if (currentAcertosStreak > maxAcertosStreak) maxAcertosStreak = currentAcertosStreak
          currentErrosStreak = 0
        } else {
          totalErros++
          currentErrosStreak++
          if (currentErrosStreak > maxErrosStreak) maxErrosStreak = currentErrosStreak
          currentAcertosStreak = 0
        }
      }

      const stats = {
        totalPalpites,
        totalAcertos,
        totalErros,
        maxAcertosStreak,
        maxErrosStreak
      }

      wrappedData.value = {
        rankingData,
        stats,
        zebrasPerdidas,
        favoriteMvp,
        favoriteTeams,
        zebraVencida,
        irmaosDeBolao,
        summary: {
          nome: rankingData.nome,
          avatar: rankingData.avatar_url,
          pontos: rankingData.pontos,
          posicao: rankingData.posicao,
          total_palpites: rankingData.total_palpites,
          acertos_vencedor: rankingData.acertos_vencedor,
          acertos_exatos: rankingData.acertos_exatos
        }
      }

    } catch (err) {
      error.value = err.message
      console.error('Erro ao buscar dados do Wrapped:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    wrappedData,
    loading,
    error,
    fetchWrappedData
  }
}
