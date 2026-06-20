import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

export function useRanking() {
  const ranking = ref([])
  const loading = ref(false)
  const error = ref(null)
  let channel = null

  async function fetchRanking() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('view_ranking')
        .select('*')
        .order('posicao', { ascending: true })

      if (fetchError) throw fetchError
      
      let finalRanking = data || []

      // Fetch additional data to calculate streaks
      const [{ data: resultadosData }, { data: palpitesData }] = await Promise.all([
        supabase.from('resultados').select('jogo_id, finalizado').eq('finalizado', true),
        supabase.from('palpites').select('usuario_id, jogo_id, pontuacao')
      ])

      if (resultadosData && palpitesData) {
        // We import jogosData inside the function to avoid circular dependencies if any,
        // or we can import it at the top. But since it's just JSON, it's safe to import.
        // Actually, let's dynamic import it or import at top. Let's just use dynamic import for safety.
        const { default: jogosData } = await import('@/data/jogos.json')
        
        const finishedJogoIds = new Set(resultadosData.map(r => r.jogo_id))
        const sortedFinishedJogos = jogosData
          .filter(j => finishedJogoIds.has(j.id))
          .sort((a, b) => new Date(b.data) - new Date(a.data))

        finalRanking.forEach(player => {
          let streak = 0
          for (const jogo of sortedFinishedJogos) {
            const palpite = palpitesData.find(p => p.jogo_id === jogo.id && p.usuario_id === player.usuario_id)
            if (palpite && palpite.pontuacao > 0) {
              streak++
            } else {
              break
            }
          }
          player.acertos_seguidos = streak
        })
      }

      ranking.value = finalRanking
    } catch (err) {
      error.value = err.message
      console.error('Erro ao buscar ranking:', err)
    } finally {
      loading.value = false
    }
  }

  function subscribe() {
    channel = supabase
      .channel('ranking-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'palpites',
        },
        () => {
          // Re-fetch ranking when any prediction changes
          fetchRanking()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resultados',
        },
        () => {
          // Re-fetch ranking when any result changes
          fetchRanking()
        }
      )
      .subscribe()
  }

  onMounted(() => {
    fetchRanking()
    subscribe()
  })

  onUnmounted(() => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  })

  return { ranking, loading, error, fetchRanking }
}
