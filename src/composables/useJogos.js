import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import jogosData from '@/data/jogos.json'

const resultados = ref({})
const palpites = ref({})
const odds = ref({})
const coringaMap = ref({}) // map of jogoId -> boolean
const loading = ref(false)
const saving = ref({})
const toast = ref(null)

export function useJogos() {
  // Group games by phase
  const jogosPorFase = computed(() => {
    const groups = {}
    jogosData.forEach(jogo => {
      if (!groups[jogo.fase]) {
        groups[jogo.fase] = []
      }
      groups[jogo.fase].push(jogo)
    })
    return groups
  })

  // All games sorted by date
  const jogosOrdenados = computed(() => {
    return [...jogosData].sort((a, b) => new Date(a.data) - new Date(b.data))
  })

  // Games grouped by date
  const jogosPorData = computed(() => {
    const groups = {}
    jogosOrdenados.value.forEach(jogo => {
      const dateKey = new Date(jogo.data).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      })
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(jogo)
    })
    return groups
  })

  // Check if a game is locked (less than 10 minutes before kickoff)
  function isLocked(jogo) {
    const kickoff = new Date(jogo.data)
    const now = new Date()
    const diffMs = kickoff.getTime() - now.getTime()
    return diffMs < 10 * 60 * 1000 // 10 minutes in ms
  }

  // Time remaining until lock
  function tempoAteBloquear(jogo) {
    const kickoff = new Date(jogo.data)
    const now = new Date()
    const diffMs = kickoff.getTime() - now.getTime()
    const lockMs = diffMs - 10 * 60 * 1000

    if (lockMs <= 0) return null

    const hours = Math.floor(lockMs / (1000 * 60 * 60))
    const minutes = Math.floor((lockMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d`
    }
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes}min`
  }

  // Get game status
  function statusJogo(jogo) {
    const resultado = resultados.value[jogo.id]
    if (resultado?.finalizado) return 'finalizado'
    
    const kickoff = new Date(jogo.data)
    const now = new Date()
    if (now >= kickoff) return 'em_andamento'
    
    return 'agendado'
  }

  // Fetch all results (Optimized for bandwidth: don't fetch heavy JSONs here)
  async function fetchResultados() {
    const { data, error } = await supabase
      .from('resultados')
      .select('jogo_id, gols_mandante, gols_visitante, fifa_match_id, finalizado, penaltis_mandante, penaltis_visitante, mvp_player_id')

    if (error) {
      console.error("fetchResultados error:", error)
    }

    if (!error && data) {
      const map = {}
      data.forEach(r => { map[r.jogo_id] = r })
      resultados.value = map
    }
  }

  // Fetch coringa flags for all games from the DB
  async function fetchCoringaJogos() {
    const { data, error } = await supabase
      .from('jogos')
      .select('id, coringa')
      .eq('coringa', true)

    if (error) {
      console.error("fetchCoringaJogos error:", error)
      return
    }

    const map = {}
    if (data) {
      data.forEach(j => { map[j.id] = true })
    }
    coringaMap.value = map
  }

  // Toggle coringa status for a game (Admin only)
  async function updateJogoCoringa(jogoId, isCoringa) {
    const { error } = await supabase
      .from('jogos')
      .update({ coringa: isCoringa })
      .eq('id', jogoId)

    if (error) {
      console.error('Erro ao atualizar coringa:', error)
      showToast('Erro ao salvar coringa 😕', 'error')
      return false
    }

    coringaMap.value = { ...coringaMap.value, [jogoId]: isCoringa }
    if (!isCoringa) delete coringaMap.value[jogoId]
    return true
  }

  // Fetch a single result timeline
  async function fetchResultadoTimeline(jogoId) {
    const { data, error } = await supabase
      .from('resultados')
      .select('timeline')
      .eq('jogo_id', jogoId)
      .single()

    if (!error && data) return data.timeline;
    return null;
  }

  // Fetch volume data directly from DB
  async function fetchVolumeDataDB(jogoId) {
    const { data, error } = await supabase
      .from('jogos')
      .select('volume_data')
      .eq('id', jogoId)
      .single()

    if (!error && data) return data.volume_data;
    return null;
  }

  // Fetch advanced stats for a single game (heavy JSONs)
  async function fetchAdvancedStats(jogoId) {
    const { data, error } = await supabase
      .from('resultados')
      .select('team_stats, player_stats, power_rankings')
      .eq('jogo_id', jogoId)
      .single()

    if (!error && data) return data;
    return null;
  }

  // Fetch user's predictions
  async function fetchPalpites(userId) {
    if (!userId) return

    const { data, error } = await supabase
      .from('palpites')
      .select('*')
      .eq('usuario_id', userId)

    if (!error && data) {
      const map = {}
      data.forEach(p => { map[p.jogo_id] = p })
      palpites.value = map
    }
  }

  // Fetch all predictions for a specific game (for "Palpites da Galera")
  async function fetchPalpitesDaGalera(jogoId) {
    const { data, error } = await supabase
      .from('palpites')
      .select(`
        usuario_id,
        gols_mandante,
        gols_visitante,
        vencedor_penaltis,
        pontuacao,
        mvp_player_id,
        mvp_player_name,
        mvp_player_picture,
        usuarios ( nome )
      `)
      .eq('jogo_id', jogoId)

    if (!error && data) {
      return data.map(p => ({
        ...p,
        nome: p.usuarios?.nome || 'Usuário',
      }))
    }
    return []
  }

  // Fetch all odds
  async function fetchOdds() {
    const { data, error } = await supabase
      .from('view_odds')
      .select('*')

    if (!error && data) {
      const map = {}
      data.forEach(o => { map[o.jogo_id] = o })
      odds.value = map
    }
  }

  // Save a prediction
  async function salvarPalpite(userId, jogoId, golsMandante, golsVisitante, vencedorPenaltis = null, mvpPlayerId = null, mvpPlayerName = null, mvpPlayerPicture = null) {
    if (saving.value[jogoId]) return
    
    saving.value[jogoId] = true

    try {
      const { data, error } = await supabase.rpc('upsert_palpite', {
        p_usuario_id: userId,
        p_jogo_id: jogoId,
        p_gols_mandante: golsMandante,
        p_gols_visitante: golsVisitante,
        p_vencedor_penaltis: vencedorPenaltis,
      })

      if (error) throw error

      const { error: updateError } = await supabase
        .from('palpites')
        .update({
          mvp_player_id: mvpPlayerId,
          mvp_player_name: mvpPlayerName,
          mvp_player_picture: mvpPlayerPicture
        })
        .match({ usuario_id: userId, jogo_id: jogoId })

      if (updateError) throw updateError

      palpites.value[jogoId] = {
        usuario_id: userId,
        jogo_id: jogoId,
        gols_mandante: golsMandante,
        gols_visitante: golsVisitante,
        vencedor_penaltis: vencedorPenaltis,
        mvp_player_id: mvpPlayerId,
        mvp_player_name: mvpPlayerName,
        mvp_player_picture: mvpPlayerPicture,
        atualizado_em: new Date().toISOString(),
      }

      showToast('Palpite salvo! ✅')
      return true
    } catch (err) {
      console.error('Erro ao salvar palpite:', err)
      showToast('Erro ao salvar 😕', 'error')
      return false
    } finally {
      saving.value[jogoId] = false
    }
  }

  // Save a result (Admin)
  async function upsertResultado(jogoId, golsMandante, golsVisitante, finalizado) {
    if (saving.value['admin_'+jogoId]) return
    
    saving.value['admin_'+jogoId] = true

    try {
      const { data, error } = await supabase
        .from('resultados')
        .upsert({
          jogo_id: jogoId,
          gols_mandante: golsMandante,
          gols_visitante: golsVisitante,
          finalizado: finalizado
        }, { onConflict: 'jogo_id' })

      if (error) throw error

      resultados.value[jogoId] = {
        jogo_id: jogoId,
        gols_mandante: golsMandante,
        gols_visitante: golsVisitante,
        finalizado: finalizado
      }

      showToast('Resultado salvo! ✅')
      return true
    } catch (err) {
      console.error('Erro ao salvar resultado:', err)
      showToast('Erro ao salvar 😕', 'error')
      return false
    } finally {
      saving.value['admin_'+jogoId] = false
    }
  }

  function showToast(message, type = 'success') {
    toast.value = { message, type }
    setTimeout(() => { toast.value = null }, 2500)
  }

  // Calculate points for a prediction
  // Note: for display purposes; the authoritative value is palpite.pontuacao from the DB
  function calcularPontos(palpite, resultado, isCoringa = false) {
    if (!resultado?.finalizado || !palpite) return null

    const pm = palpite.gols_mandante
    const pv = palpite.gols_visitante
    const pp = palpite.vencedor_penaltis
    
    const rm = resultado.gols_mandante
    const rv = resultado.gols_visitante
    const rpm = resultado.penaltis_mandante
    const rpv = resultado.penaltis_visitante

    let vpr = null
    if (rpm > rpv) vpr = 'mandante'
    else if (rpv > rpm) vpr = 'visitante'

    let pontos = 0
    let tipo = 'erro'

    if (pm === rm && pv === rv) {
      tipo = 'exato'
      if (pm === pv && pp === vpr && vpr !== null) {
        pontos = isCoringa ? 14 : 7
      } else if (pm === pv && pp !== null) {
        pontos = isCoringa ? 10 : 5
      } else {
        pontos = isCoringa ? 10 : 5
      }
    } else if (Math.sign(pm - pv) === Math.sign(rm - rv)) {
      tipo = 'vencedor'
      if (pm === pv && pp === vpr && vpr !== null) {
        pontos = isCoringa ? 10 : 5
      } else if (pm === pv && pp !== null) {
        pontos = isCoringa ? 6 : 3
      } else {
        pontos = isCoringa ? 6 : 3
      }
    } else {
      pontos = isCoringa ? -3 : 0
    }

    // MVP extra points
    if (palpite.mvp_player_id && resultado.mvp_player_id && palpite.mvp_player_id === resultado.mvp_player_id) {
      pontos += isCoringa ? 4 : 2;
    }

    return { pontos, tipo }
  }

  function isFutureLocked(jogo) {
    const kickoff = new Date(jogo.data)
    const now = new Date()
    
    // Create tomorrow's end of day (23:59:59)
    const tomorrowEnd = new Date(now)
    tomorrowEnd.setHours(23, 59, 59, 999)
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)

    return kickoff.getTime() > tomorrowEnd.getTime()
  }

  return {
    jogosData,
    jogosOrdenados,
    jogosPorFase,
    jogosPorData,
    resultados,
    palpites,
    odds,
    coringaMap,
    loading,
    saving,
    toast,
    isLocked,
    isFutureLocked,
    tempoAteBloquear,
    statusJogo,
    fetchResultados,
    fetchResultadoTimeline,
    fetchAdvancedStats,
    fetchPalpites,
    fetchPalpitesDaGalera,
    fetchOdds,
    fetchCoringaJogos,
    updateJogoCoringa,
    salvarPalpite,
    upsertResultado,
    calcularPontos,
    fetchVolumeDataDB,
  }
}
