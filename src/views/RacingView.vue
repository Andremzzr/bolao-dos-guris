<template>
  <div class="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center overflow-hidden w-[100vw] h-[100vh] m-0 p-0">
    <div class="relative w-full max-w-none shadow-2xl flex flex-col overflow-hidden bg-slate-900 border border-slate-800" style="aspect-ratio: 16/9; max-height: 100vh;">
      
      <!-- Background Elements -->
      <div class="absolute inset-0 z-0 bg-[url('/field-bg.png')] bg-cover bg-center opacity-10"></div>
      <div class="absolute inset-0 z-0 bg-gradient-to-b from-slate-900/80 to-slate-950"></div>
      
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-copa-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <header class="relative z-10 p-4 md:p-6 shrink-0 flex items-center justify-between glass border-b border-copa-border shadow-lg">
        <div class="flex items-center gap-4">
          <router-link to="/ranking" class="text-slate-400 hover:text-white mr-2 bg-slate-800 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </router-link>
          <PhTrophy :size="32" class="text-copa-gold drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" weight="fill" />
          <div>
            <h1 class="text-xl md:text-3xl font-black text-white tracking-wide">Evolução do <span class="text-transparent bg-clip-text bg-gradient-to-r from-copa-gold to-yellow-200">Top 10</span></h1>
            <p class="text-sm text-slate-400 font-medium">Corrida de pontos ao longo do torneio</p>
          </div>
        </div>
        <button 
          @click="startAnimation" 
          v-if="dataReady" 
          class="bg-gradient-to-r from-copa-accent to-copa-accent-dark text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg shadow-copa-accent/30 hover:opacity-90 hover:scale-105 transition-all flex items-center gap-2 border border-copa-accent-light"
        >
          <span v-if="isAnimating" class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          {{ isAnimating ? 'Pausar/Recomeçar' : (animationFinished ? 'Replay' : 'Iniciar Corrida') }}
        </button>
      </header>

      <div class="flex-1 relative z-10 flex flex-col min-h-0 w-full p-2 md:p-6 pb-8">
        <div v-if="loading" class="flex-1 flex flex-col items-center justify-center gap-4">
          <div class="relative">
            <div class="w-16 h-16 border-4 border-slate-700 rounded-full"></div>
            <div class="w-16 h-16 border-4 border-copa-accent rounded-full border-t-transparent animate-spin absolute inset-0"></div>
          </div>
          <p class="text-slate-400 font-medium animate-pulse">Processando rodadas...</p>
        </div>
        <div ref="chartRef" class="flex-1 w-full transition-opacity duration-1000" :class="{ 'opacity-0': loading, 'opacity-100': !loading }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import * as echarts from 'echarts'
import { PhTrophy } from '@phosphor-icons/vue'

import jogosJson from '@/data/jogos.json'

const chartRef = ref(null)
const loading = ref(true)
const dataReady = ref(false)
const isAnimating = ref(false)
const animationFinished = ref(false)

const chartInstance = shallowRef(null)
let timelineInterval = null

let days = []
let playersMap = {}
let currentDayIndex = 0
let top10Players = []

const chartColors = [
  '#facc15', // gold
  '#38bdf8', // sky
  '#f472b6', // pink
  '#a78bfa', // purple
  '#34d399', // emerald
  '#fb923c'  // orange
]

async function fetchData() {
  loading.value = true
  try {
    const { data: rankingData, error: errRank } = await supabase
      .from('view_ranking')
      .select('usuario_id, nome, avatar_url')

    if (errRank) throw errRank

    const rankingPromises = rankingData.map(async r => {
      let loadedAvatar = null;
      if (r.avatar_url) {
        try {
          loadedAvatar = await new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = r.avatar_url;
          });
        } catch (e) {
          console.error(e);
        }
      }

      playersMap[r.usuario_id] = {
        id: r.usuario_id,
        nome: r.nome || 'Desconhecido',
        avatar: r.avatar_url,
        loadedAvatar, // Loaded HTMLImageElement
        initial: (r.nome || '?').charAt(0).toUpperCase(),
        dailyScores: {},
        cumulativeScores: []
      }
    })

    await Promise.all(rankingPromises);

    const { data: palpitesData, error: errPalp } = await supabase
      .from('palpites')
      .select('usuario_id, jogo_id, pontuacao')
      .not('pontuacao', 'is', null)

    if (errPalp) throw errPalp

    const gamesByDate = {}
    jogosJson.forEach(jogo => {
      const dateStr = jogo.data.split('T')[0]
      if (!gamesByDate[dateStr]) gamesByDate[dateStr] = []
      gamesByDate[dateStr].push(jogo.id)
    })

    const allDates = Object.keys(gamesByDate).sort()
    const validDates = []
    
    allDates.forEach(date => {
      const gameIds = gamesByDate[date]
      let dayHasPoints = false
      const dayPointsByPlayer = {}
      
      palpitesData.forEach(p => {
        if (gameIds.includes(p.jogo_id)) {
          if (!dayPointsByPlayer[p.usuario_id]) dayPointsByPlayer[p.usuario_id] = 0
          dayPointsByPlayer[p.usuario_id] += p.pontuacao
          if (p.pontuacao > 0) dayHasPoints = true
        }
      })

      if (dayHasPoints) {
        validDates.push(date)
        Object.keys(playersMap).forEach(uid => {
          playersMap[uid].dailyScores[date] = dayPointsByPlayer[uid] || 0
        })
      }
    })

    days = validDates.map(d => {
      const [y, m, day] = d.split('-')
      return `${day}/${m}`
    })

    Object.keys(playersMap).forEach(uid => {
      const player = playersMap[uid]
      let cumulative = 0
      player.cumulativeScores = validDates.map(date => {
        cumulative += player.dailyScores[date] || 0
        return cumulative
      })
    })

    const playersArr = Object.values(playersMap)
    playersArr.sort((a, b) => {
      const scoreA = a.cumulativeScores[a.cumulativeScores.length - 1] || 0
      const scoreB = b.cumulativeScores[b.cumulativeScores.length - 1] || 0
      return scoreB - scoreA
    })
    
    top10Players = playersArr.slice(0, 10)

    dataReady.value = true
    initChart()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

function initChart() {
  if (chartInstance.value) chartInstance.value.dispose()
  chartInstance.value = echarts.init(chartRef.value)

  const globalRichObj = {
    name: { color: '#e2e8f0', fontSize: 14, fontWeight: 'bold', padding: [0, 8, 0, 8] }
  }

  const allPlayersArr = Object.values(playersMap)
  allPlayersArr.forEach((player, idx) => {
    const avatarKey = `avatar_${idx}`
    const initialKey = `initial_${idx}`
    const scoreKey = `score_${idx}`
    const color = chartColors[idx % chartColors.length]
    
    player.idx = idx
    player.color = color

    if (player.loadedAvatar) {
      globalRichObj[avatarKey] = {
        backgroundColor: { image: player.loadedAvatar },
        width: 36, height: 36, borderRadius: 18,
        shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 4
      }
    } else if (player.avatar) {
      globalRichObj[avatarKey] = {
        backgroundColor: { image: player.avatar },
        width: 36, height: 36, borderRadius: 18,
        shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 4
      }
    }
    
    globalRichObj[initialKey] = {
      backgroundColor: color,
      color: '#1e293b',
      width: 36, height: 36, borderRadius: 18,
      align: 'center', lineHeight: 36, fontWeight: 'black', fontSize: 18,
      shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 4
    }
    
    globalRichObj[scoreKey] = {
      color: color, fontSize: 18, fontWeight: 'black', textShadowColor: 'rgba(0,0,0,0.5)', textShadowBlur: 2
    }
  })

  const option = {
    backgroundColor: 'transparent',
    grid: {
      left: '2%',
      width: '50%', // Make the bars take exactly half the width
      top: '10%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      max: 'dataMax',
      axisLine: { show: false },
      axisLabel: { color: '#94a3b8', fontWeight: 'bold', fontSize: 14, margin: 15 },
      splitLine: { show: true, lineStyle: { color: '#1e293b', type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      inverse: true, // Highest values at the top
      max: 9, // Show top 10
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false }, // Hide left labels
      animationDuration: 300,
      animationDurationUpdate: 300
    },
    series: [
      {
        realtimeSort: true,
        name: 'Pontos',
        type: 'bar',
        data: [], // Will be filled dynamically
        barWidth: '60%',
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          shadowColor: 'rgba(0,0,0,0.3)',
          shadowBlur: 5,
          shadowOffsetX: 3
        },
        label: {
          show: true,
          position: 'right',
          distance: 15,
          valueAnimation: true,
          formatter: (params) => {
            const p = params.data
            const avatarKey = `avatar_${p.playerIdx}`
            const initialKey = `initial_${p.playerIdx}`
            const scoreKey = `score_${p.playerIdx}`

            if (p.hasAvatar) {
              return `{${avatarKey}|} {name|${p.name.split(' ')[0]}} {${scoreKey}|${params.value}}`
            } else {
              return `{${initialKey}|${p.initialStr}} {name|${p.name.split(' ')[0]}} {${scoreKey}|${params.value}}`
            }
          },
          rich: globalRichObj
        }
      }
    ],
    // Graphic for the Day text in the background
    graphic: {
      elements: [
        {
          type: 'text',
          right: '5%',
          bottom: '10%',
          style: {
            text: '',
            font: 'bolder 60px "Inter", sans-serif',
            fill: 'rgba(255, 255, 255, 0.1)',
            textAlign: 'right'
          },
          z: 0
        }
      ]
    },
    animationDuration: 0,
    animationDurationUpdate: 1500,
    animationEasing: 'linear',
    animationEasingUpdate: 'linear'
  }

  chartInstance.value.setOption(option)
}

function startAnimation() {
  if (!dataReady.value) return
  
  if (isAnimating.value) {
    clearInterval(timelineInterval)
    isAnimating.value = false
    return
  }

  isAnimating.value = true
  animationFinished.value = false
  currentDayIndex = 0
  
  const allPlayersArr = Object.values(playersMap)

  // Initialize with zero data
  const initialData = allPlayersArr.map(player => ({
    value: 0,
    name: player.nome,
    playerIdx: player.idx,
    hasAvatar: !!(player.loadedAvatar || player.avatar),
    initialStr: player.initial,
    itemStyle: { color: player.color }
  }))

  chartInstance.value.setOption({
    series: [{ data: initialData }],
    graphic: { elements: [{ style: { text: days[0] || '' } }] }
  })

  // Start interval
  timelineInterval = setInterval(() => {
    if (currentDayIndex >= days.length) {
      clearInterval(timelineInterval)
      isAnimating.value = false
      animationFinished.value = true
      return
    }

    const currentData = allPlayersArr.map(player => ({
      value: player.cumulativeScores[currentDayIndex] || 0,
      name: player.nome,
      playerIdx: player.idx,
      hasAvatar: !!(player.loadedAvatar || player.avatar),
      initialStr: player.initial,
      itemStyle: { color: player.color }
    }))
    
    chartInstance.value.setOption({
      series: [{ data: currentData }],
      graphic: { elements: [{ style: { text: `Dia ${days[currentDayIndex]}` } }] }
    })
    
    currentDayIndex++
  }, 1500)
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (timelineInterval) clearInterval(timelineInterval)
  window.removeEventListener('resize', handleResize)
  if (chartInstance.value) chartInstance.value.dispose()
})

function handleResize() {
  if (chartInstance.value) chartInstance.value.resize()
}
</script>

<style scoped>
/* Glassmorphism effects */
.glass {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
</style>
