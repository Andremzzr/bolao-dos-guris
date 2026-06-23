<template>
  <div class="glass rounded-2xl p-4 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
        <PhTrendUp :size="16" class="text-copa-accent-light" /> Pontos por Dia de Jogo
      </h3>
    </div>

    <!-- Chart Container -->
    <div v-if="loadingData" class="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
      <div class="w-8 h-8 border-2 border-copa-accent border-t-transparent rounded-full animate-spin"></div>
      <span class="text-xs">Carregando gráfico...</span>
    </div>

    <div v-else-if="chartData.length === 0" class="py-8 text-center text-slate-400 glass rounded-xl border border-copa-border/20 p-6">
      <p class="text-sm">Nenhum palpite computado ainda.</p>
      <p class="text-xs text-slate-500 mt-1">Os pontos aparecerão aqui assim que os jogos com seus palpites forem finalizados.</p>
    </div>

    <div v-else class="space-y-4">
      <!-- SVG Chart -->
      <div class="relative w-full overflow-visible">
        <svg
          class="w-full h-auto overflow-visible select-none"
          :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
          @mouseleave="handleMouseLeave"
        >
          <!-- Gradients definition -->
          <defs>
            <linearGradient id="chartAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--color-copa-accent)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="var(--color-copa-accent)" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="chartLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="var(--color-copa-accent-light)" />
              <stop offset="100%" stop-color="var(--color-copa-green)" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Horizontal Grid Lines -->
          <g class="grid-lines">
            <line
              v-for="tick in gridTicks"
              :key="tick"
              :x1="padding.left"
              :y1="getY(tick)"
              :x2="svgWidth - padding.right"
              :y2="getY(tick)"
              stroke="var(--color-copa-border)"
              stroke-opacity="0.25"
              stroke-dasharray="2,3"
            />
            <!-- Y-Axis Labels -->
            <text
              v-for="tick in gridTicks"
              :key="`lbl-${tick}`"
              :x="padding.left - 6"
              :y="getY(tick) + 3.5"
              text-anchor="end"
              class="text-[11px] font-bold fill-slate-400 font-sans"
            >
              {{ tick }}
            </text>
          </g>

          <!-- Area under path -->
          <path
            v-if="chartData.length > 1"
            :d="areaPathString"
            fill="url(#chartAreaGradient)"
          />

          <!-- Main line (Creates the rollercoaster design) -->
          <path
            v-if="chartData.length > 1"
            :d="linePathString"
            fill="none"
            stroke="url(#chartLineGradient)"
            stroke-width="2.5"
            stroke-linecap="round"
            filter="url(#glow)"
          />

          <!-- If there is only one data point, render a small line representation -->
          <line
            v-if="chartData.length === 1"
            :x1="padding.left"
            :y1="getY(chartData[0].dailyPoints)"
            :x2="svgWidth - padding.right"
            :y2="getY(chartData[0].dailyPoints)"
            stroke="var(--color-copa-accent-light)"
            stroke-width="1.5"
            stroke-opacity="0.3"
            stroke-dasharray="2,2"
          />

          <!-- Grid ticks on X-axis (Dates) -->
          <g class="x-axis-labels">
            <text
              v-for="(point, idx) in visibleXLabels"
              :key="idx"
              :x="getX(point.index)"
              :y="svgHeight - padding.bottom + 20"
              text-anchor="middle"
              class="text-[12px] font-bold fill-slate-300 font-sans"
            >
              {{ point.label }}
            </text>
          </g>

          <!-- Data Points (Circles) -->
          <g>
            <circle
              v-for="(point, idx) in chartData"
              :key="idx"
              :cx="getX(idx)"
              :cy="getY(point.dailyPoints)"
              :r="hoveredIndex === idx ? 5.5 : 3"
              :fill="hoveredIndex === idx ? 'var(--color-copa-green)' : 'var(--color-copa-accent)'"
              :stroke="hoveredIndex === idx ? '#ffffff' : 'var(--color-copa-bg)'"
              :stroke-width="hoveredIndex === idx ? 2 : 1"
              class="transition-all duration-150"
            />
          </g>

          <!-- Vertical interactive indicator line -->
          <line
            v-if="hoveredIndex !== null"
            :x1="getX(hoveredIndex)"
            :y1="padding.top"
            :x2="getX(hoveredIndex)"
            :y2="svgHeight - padding.bottom"
            stroke="var(--color-copa-green)"
            stroke-opacity="0.4"
            stroke-dasharray="2,2"
          />

          <!-- Invisible overlay bars to capture hover easily -->
          <g>
            <rect
              v-for="(point, idx) in chartData"
              :key="`hover-${idx}`"
              :x="getHoverRectX(idx)"
              :y="0"
              :width="getHoverRectWidth()"
              :height="svgHeight"
              fill="transparent"
              class="cursor-pointer"
              @mouseenter="hoveredIndex = idx"
              @touchstart="hoveredIndex = idx"
            />
          </g>
        </svg>
      </div>

      <!-- Tooltip / Match Details for the selected day -->
      <div v-if="selectedDay" class="bg-slate-900/80 rounded-xl p-3 border border-copa-border/40 space-y-2.5 animate-fade-in">
        <div class="flex items-center justify-between border-b border-copa-border/30 pb-2">
          <span class="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <PhCalendar :size="13" class="text-slate-400" />{{ selectedDay.labelFull }}
          </span>
          <span class="text-[11px] font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-copa-border/30">
            <span class="text-copa-gold font-black">{{ selectedDay.dailyPoints }}</span> pts
          </span>
        </div>

        <div class="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
          <div
            v-for="item in selectedDay.matches"
            :key="item.match.id"
            class="flex items-center justify-between gap-3 p-2 rounded-lg bg-copa-surface/30 border border-copa-border/10 text-xs"
          >
            <!-- Teams and score -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <div class="flex flex-col gap-1 flex-1 min-w-0">
                <!-- Home team -->
                <div class="flex items-center gap-1.5 min-w-0">
                  <img
                    v-if="getFlagUrl(item.match.mandante)"
                    :src="getFlagUrl(item.match.mandante)"
                    class="w-4 h-3 object-cover rounded-sm shadow-sm shrink-0"
                    loading="lazy"
                  />
                  <span class="truncate font-semibold text-slate-200" :class="{ 'font-bold text-white': item.match.mandante === getWinner(item.resultado) }">
                    {{ item.match.mandante }}
                  </span>
                </div>
                <!-- Away team -->
                <div class="flex items-center gap-1.5 min-w-0">
                  <img
                    v-if="getFlagUrl(item.match.visitante)"
                    :src="getFlagUrl(item.match.visitante)"
                    class="w-4 h-3 object-cover rounded-sm shadow-sm shrink-0"
                    loading="lazy"
                  />
                  <span class="truncate font-semibold text-slate-200" :class="{ 'font-bold text-white': item.match.visitante === getWinner(item.resultado) }">
                    {{ item.match.visitante }}
                  </span>
                </div>
              </div>
              
              <!-- Real Match Result -->
              <div class="flex flex-col items-center justify-center px-2 py-1 rounded bg-slate-950/80 border border-copa-border/20 shrink-0 font-mono text-[10px] font-bold text-white text-center leading-none gap-0.5 min-w-[34px]">
                <div class="text-[8px] text-slate-500 uppercase tracking-widest font-sans font-bold">Placar</div>
                <div>{{ item.resultado.gols_mandante }} - {{ item.resultado.gols_visitante }}</div>
              </div>
            </div>

            <!-- Prediction and points earned -->
            <div class="flex items-center gap-2 shrink-0">
              <div class="text-right min-w-[55px]">
                <div class="text-[9px] text-slate-500 font-bold">Seu palpite</div>
                <div class="font-mono font-bold text-slate-300">
                  {{ item.palpite ? `${item.palpite.gols_mandante} - ${item.palpite.gols_visitante}` : 'Sem palpite' }}
                </div>
              </div>
              <div
                :class="[
                  'px-1.5 py-1 rounded text-[10px] font-black min-w-[45px] text-center border font-mono',
                  item.pontos === 5
                    ? 'bg-copa-gold/10 text-copa-gold border-copa-gold/30'
                    : item.pontos === 3
                    ? 'bg-copa-green/10 text-copa-green border-copa-green/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                ]"
              >
                +{{ item.pontos }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-1 text-[10px] text-slate-500 flex items-center justify-center gap-1">
        <PhLightbulb :size="12" class="text-slate-500" /> Selecione os pontos do gráfico para ver o detalhamento do dia
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { PhTrendUp, PhCalendar, PhLightbulb } from '@phosphor-icons/vue'
import { useAuth } from '@/composables/useAuth'
import { useJogos } from '@/composables/useJogos'
import { getFlagUrl } from '@/utils/flags'

const { user } = useAuth()
const { palpites, resultados, fetchPalpites, fetchResultados, jogosOrdenados } = useJogos()

const loadingData = ref(false)
const hoveredIndex = ref(null)

// SVG Config
const svgWidth = 500
const svgHeight = 180
const padding = { top: 15, right: 15, bottom: 32, left: 30 }

onMounted(async () => {
  if (user.value?.id) {
    loadingData.value = true
    try {
      await Promise.all([
        fetchPalpites(user.value.id),
        fetchResultados()
      ])
    } catch (e) {
      console.error('Erro ao carregar dados do gráfico:', e)
    } finally {
      loadingData.value = false
    }
  }
})

// Build data points grouped by match date
const chartData = computed(() => {
  if (!user.value?.id || !jogosOrdenados.value || jogosOrdenados.value.length === 0) return []

  // Group finalized matches by date (YYYY-MM-DD)
  const groups = {}
  jogosOrdenados.value.forEach(jogo => {
    const res = resultados.value[jogo.id]
    if (res?.finalizado) {
      const dateKey = jogo.data.split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(jogo)
    }
  })

  // Sort dates chronologically
  const sortedDates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b))

  const results = []
  sortedDates.forEach(dateStr => {
    const games = groups[dateStr]
    // Check if the user placed a prediction on at least one game of this day
    const hasAnyPrediction = games.some(jogo => palpites.value[jogo.id] !== undefined)
    
    if (hasAnyPrediction) {
      const matchesDetails = games.map(jogo => {
        const palpite = palpites.value[jogo.id]
        const pontos = palpite?.pontuacao ?? 0
        const resultado = resultados.value[jogo.id]
        return {
          match: jogo,
          palpite,
          resultado,
          pontos
        }
      })

      const dailyPoints = matchesDetails.reduce((sum, item) => sum + item.pontos, 0)

      results.push({
        dateStr,
        label: formatDateLabel(dateStr),
        labelFull: formatDateLabelFull(dateStr),
        matches: matchesDetails,
        dailyPoints
      })
    }
  })

  return results
})

// Set initial selection to the latest day
watch(
  () => chartData.value,
  (newData) => {
    if (newData.length > 0 && hoveredIndex.value === null) {
      hoveredIndex.value = newData.length - 1
    }
  },
  { immediate: true }
)

const selectedDay = computed(() => {
  if (hoveredIndex.value === null || chartData.value.length === 0) return null
  const idx = Math.min(hoveredIndex.value, chartData.value.length - 1)
  return chartData.value[idx]
})

function handleMouseLeave() {
  if (chartData.value.length > 0) {
    hoveredIndex.value = chartData.value.length - 1
  } else {
    hoveredIndex.value = null
  }
}

// Coordinate calculations
function getX(idx) {
  if (chartData.value.length <= 1) return padding.left + (svgWidth - padding.left - padding.right) / 2
  const chartWidth = svgWidth - padding.left - padding.right
  return padding.left + (idx * chartWidth) / (chartData.value.length - 1)
}

function getY(val) {
  const chartHeight = svgHeight - padding.top - padding.bottom
  const maxVal = maxChartVal.value
  return svgHeight - padding.bottom - (val * chartHeight) / (maxVal || 1)
}

// Axis values (adjusted for daily points, max usually 15 or 20)
const maxChartVal = computed(() => {
  const values = chartData.value.map(d => d.dailyPoints)
  const max = Math.max(...values, 5)
  
  if (max <= 5) return 5
  if (max <= 10) return 10
  if (max <= 15) return 15
  if (max <= 20) return 20
  if (max <= 30) return 30
  return Math.ceil(max / 5) * 5
})

const gridTicks = computed(() => {
  const max = maxChartVal.value
  if (max === 5) return [0, 1, 2, 3, 4, 5]
  if (max === 10) return [0, 2, 4, 6, 8, 10]
  if (max === 15) return [0, 3, 6, 9, 12, 15]
  if (max === 20) return [0, 5, 10, 15, 20]
  if (max === 30) return [0, 10, 20, 30]
  return [0, Math.round(max * 0.33), Math.round(max * 0.66), max]
})

const visibleXLabels = computed(() => {
  const data = chartData.value
  if (data.length === 0) return []
  if (data.length <= 6) {
    return data.map((d, i) => ({ index: i, label: d.label }))
  }

  const result = []
  const step = Math.ceil(data.length / 5)
  for (let i = 0; i < data.length; i += step) {
    result.push({ index: i, label: data[i].label })
  }
  
  // Ensure the last one is always present
  if (result[result.length - 1].index !== data.length - 1) {
    result.push({ index: data.length - 1, label: data[data.length - 1].label })
  }
  return result
})

// Hover area geometry
function getHoverRectX(idx) {
  const chartWidth = svgWidth - padding.left - padding.right
  const stepWidth = chartWidth / (chartData.value.length - 1 || 1)
  if (idx === 0) return padding.left
  return getX(idx) - stepWidth / 2
}

function getHoverRectWidth() {
  if (chartData.value.length <= 1) return svgWidth
  const chartWidth = svgWidth - padding.left - padding.right
  return chartWidth / (chartData.value.length - 1)
}

// SVG paths (creates the rollercoaster visual representation)
const linePathString = computed(() => {
  if (chartData.value.length <= 1) return ''
  const points = chartData.value.map((d, i) => {
    const x = getX(i)
    const y = getY(d.dailyPoints)
    return `${x},${y}`
  })
  return `M ${points.join(' L ')}`
})

const areaPathString = computed(() => {
  if (chartData.value.length <= 1) return ''
  const firstX = getX(0)
  const lastX = getX(chartData.value.length - 1)
  const baseY = svgHeight - padding.bottom

  const points = chartData.value.map((d, i) => {
    const x = getX(i)
    const y = getY(d.dailyPoints)
    return `${x},${y}`
  })

  return `M ${firstX},${baseY} L ${points.join(' L ')} L ${lastX},${baseY} Z`
})

// Date formatting helpers
function formatDateLabel(dateStr) {
  const [, month, day] = dateStr.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${parseInt(day)}/${months[parseInt(month) - 1]}`
}

function formatDateLabelFull(dateStr) {
  const [year, month, day] = dateStr.split('-')
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${parseInt(day)} de ${months[parseInt(month) - 1]} de ${year}`
}

// Match winner finder helper for bolding names
function getWinner(result) {
  if (!result || !result.finalizado) return null
  if (result.gols_mandante > result.gols_visitante) return result.mandante
  if (result.gols_visitante > result.gols_mandante) return result.visitante
  return 'Empate'
}
</script>

<style scoped>
.x-axis-labels text, .grid-lines text {
  font-family: inherit;
}
/* Custom scrollbar for tooltip content */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--color-copa-surface-light);
  border-radius: 999px;
}
</style>
