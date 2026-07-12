import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

export function useTopMVPs() {
  const topMVPs = ref([])
  const loadingMVPs = ref(false)

  async function fetchTopMVPs() {
    loadingMVPs.value = true
    try {
      const { data, error } = await supabase
        .from('palpites')
        .select('mvp_player_name, mvp_player_picture')
        .not('mvp_player_name', 'is', null)
        .neq('mvp_player_name', '')

      if (error) throw error

      const mvpData = {}
      if (data) {
        data.forEach(palpite => {
          if (!palpite.mvp_player_name) return
          const name = palpite.mvp_player_name.trim()
          if (!mvpData[name]) {
            mvpData[name] = { count: 0, picture: palpite.mvp_player_picture }
          }
          mvpData[name].count += 1
          if (!mvpData[name].picture && palpite.mvp_player_picture) {
            mvpData[name].picture = palpite.mvp_player_picture
          }
        })
      }

      const sorted = Object.entries(mvpData)
        .map(([name, info]) => ({ name, count: info.count, picture: info.picture }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      topMVPs.value = sorted
    } catch (err) {
      console.error('Erro ao buscar top MVPs:', err)
    } finally {
      loadingMVPs.value = false
    }
  }

  onMounted(() => {
    fetchTopMVPs()
  })

  return { topMVPs, loadingMVPs, fetchTopMVPs }
}
