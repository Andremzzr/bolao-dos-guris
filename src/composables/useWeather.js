import { ref } from 'vue'
import { stadiumCoords } from '@/data/stadiumCoords'

const weatherMap = ref({}) // map of estadio -> weather data
const fetching = ref(false)

export function useWeather() {
  async function fetchWeatherForToday(jogosDeHoje) {
    if (fetching.value || !jogosDeHoje || jogosDeHoje.length === 0) return
    
    fetching.value = true

    try {
      // Obter estádios únicos dos jogos de hoje
      const uniqueStadiums = [...new Set(jogosDeHoje.map(j => j.estadio))]

      const promises = uniqueStadiums.map(async (estadio) => {
        // Se já temos a temperatura, não precisamos buscar novamente
        if (weatherMap.value[estadio]) return

        const coords = stadiumCoords[estadio]
        if (!coords) {
          console.warn(`Coordenadas não encontradas para o estádio: ${estadio}`)
          return
        }

        try {
          const response = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`)
          if (!response.ok) throw new Error(`Status HTTP: ${response.status}`)
          
          const data = await response.json()
          weatherMap.value[estadio] = data
        } catch (err) {
          console.error(`Erro ao buscar clima para ${estadio}:`, err)
        }
      })

      await Promise.all(promises)
    } finally {
      fetching.value = false
    }
  }

  return {
    weatherMap,
    fetchWeatherForToday
  }
}
