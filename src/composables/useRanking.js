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
      ranking.value = data || []
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
