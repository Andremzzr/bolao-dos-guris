import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import jogosData from '@/data/jogos.json'

export function useJogos() {
  const resultados = ref({})
  const palpites = ref({})
  const odds = ref({})
  const loading = ref(false)
  const saving = ref({})
  const toast = ref(null)

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

  // Check if a game is locked (less than 1 hour before kickoff)
  function isLocked(jogo) {
    const kickoff = new Date(jogo.data)
    const now = new Date()
    const diffMs = kickoff.getTime() - now.getTime()
    return diffMs < 60 * 60 * 1000 // 1 hour in ms
  }

  // Time remaining until lock
  function tempoAteBloquear(jogo) {
    const kickoff = new Date(jogo.data)
    const now = new Date()
    const diffMs = kickoff.getTime() - now.getTime()
    const lockMs = diffMs - 60 * 60 * 1000

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

  // Fetch all results
  async function fetchResultados() {
    const { data, error } = await supabase
      .from('resultado')
      .select('*')

    if (!error && data) {
      const map = {}
      data.forEach(r => { map[r.jogo_id] = r })
      resultados.value = map
    }
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
  async function salvarPalpite(userId, jogoId, golsMandante, golsVisitante) {
    if (saving.value[jogoId]) return
    
    saving.value[jogoId] = true

    try {
      const { data, error } = await supabase.rpc('upsert_palpite', {
        p_usuario_id: userId,
        p_jogo_id: jogoId,
        p_gols_mandante: golsMandante,
        p_gols_visitante: golsVisitante,
      })

      if (error) throw error

      palpites.value[jogoId] = {
        usuario_id: userId,
        jogo_id: jogoId,
        gols_mandante: golsMandante,
        gols_visitante: golsVisitante,
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
        .from('resultado')
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
  function calcularPontos(palpite, resultado) {
    if (!resultado?.finalizado || !palpite) return null

    const pm = palpite.gols_mandante
    const pv = palpite.gols_visitante
    const rm = resultado.gols_mandante
    const rv = resultado.gols_visitante

    // Exact score
    if (pm === rm && pv === rv) return { pontos: 25, tipo: 'exato' }

    // Correct winner + goal difference
    if (
      Math.sign(pm - pv) === Math.sign(rm - rv) &&
      (pm - pv) === (rm - rv)
    ) return { pontos: 18, tipo: 'saldo' }

    // Correct winner only
    if (Math.sign(pm - pv) === Math.sign(rm - rv)) {
      return { pontos: 10, tipo: 'vencedor' }
    }

    return { pontos: 0, tipo: 'erro' }
  }

  return {
    jogosData,
    jogosOrdenados,
    jogosPorFase,
    jogosPorData,
    resultados,
    palpites,
    odds,
    loading,
    saving,
    toast,
    isLocked,
    tempoAteBloquear,
    statusJogo,
    fetchResultados,
    fetchPalpites,
    fetchOdds,
    salvarPalpite,
    upsertResultado,
    calcularPontos,
  }
}
