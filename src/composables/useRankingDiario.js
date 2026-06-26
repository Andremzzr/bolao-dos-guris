import { ref, watch, isRef, unref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

export function useRankingDiario(dateRef) {
  const ranking = ref([])
  const loading = ref(false)
  const error = ref(null)
  let channel = null

  async function fetchRankingDiario() {
    loading.value = true
    error.value = null

    try {
      const dateStr = unref(dateRef)
      const { data, error: fetchError } = await supabase
        .from('view_ranking_diario')
        .select('*')
        .eq('data_jogo', dateStr)
        .order('posicao', { ascending: true })

      if (fetchError) throw fetchError
      ranking.value = data || []
    } catch (err) {
      error.value = err.message
      console.error('Erro ao buscar ranking diário:', err)
    } finally {
      loading.value = false
    }
  }

  function subscribe() {
    const uniqueId = Math.random().toString(36).substring(7)
    channel = supabase
      .channel('ranking-diario-updates-' + uniqueId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'palpites',
        },
        () => {
          fetchRankingDiario()
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
          fetchRankingDiario()
        }
      )
      .subscribe()
  }

  if (isRef(dateRef)) {
    watch(dateRef, () => {
      fetchRankingDiario()
    })
  }

  onMounted(() => {
    if (unref(dateRef)) {
      fetchRankingDiario()
      subscribe()
    }
  })

  onUnmounted(() => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  })

  return { ranking, loading, error, fetchRankingDiario }
}
