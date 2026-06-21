<template>
  <div class="pb-20 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="relative px-4 py-3 flex items-center">
        <button @click="$router.back()" class="p-2 rounded-lg text-white tap-scale relative z-10">
          &larr;
        </button>
        <h1 class="absolute inset-0 flex items-center justify-center font-bold text-white text-lg pointer-events-none">
          Estatísticas da Partida
        </h1>
      </div>
    </header>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-copa-accent" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <div v-else-if="jogo" class="p-4 space-y-4 max-w-2xl mx-auto">
      <!-- Game Result Top -->
      <div class="glass p-5 rounded-2xl shadow-xl flex flex-col gap-4">
        <div class="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {{ jogo.fase?.replace('Fase de Grupos - ', '') }}
        </div>
        
        <div class="flex items-center justify-center gap-4">
          <!-- Home -->
          <div class="flex flex-col items-center gap-2 w-1/3">
            <img v-if="getFlagUrl(jogo.mandante)" :src="getFlagUrl(jogo.mandante)" class="w-16 h-12 object-cover rounded shadow" />
            <span class="font-bold text-white text-center text-sm sm:text-base">{{ jogo.mandante }}</span>
          </div>
          
          <!-- Score -->
          <div class="flex items-center gap-2">
            <span class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-slate-700 text-white font-black text-2xl sm:text-3xl shadow-inner">
              {{ resultado?.gols_mandante ?? '-' }}
            </span>
            <span class="text-slate-500 font-bold text-lg">×</span>
            <span class="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-slate-700 text-white font-black text-2xl sm:text-3xl shadow-inner">
              {{ resultado?.gols_visitante ?? '-' }}
            </span>
          </div>
          
          <!-- Away -->
          <div class="flex flex-col items-center gap-2 w-1/3">
            <img v-if="getFlagUrl(jogo.visitante)" :src="getFlagUrl(jogo.visitante)" class="w-16 h-12 object-cover rounded shadow" />
            <span class="font-bold text-white text-center text-sm sm:text-base">{{ jogo.visitante }}</span>
          </div>
        </div>
        
        <div class="text-center text-xs text-slate-500 mt-2">
          {{ formattedDate }} • {{ jogo.estadio }}
        </div>
      </div>

      <!-- Team Stats -->
      <MatchTeamStats 
        v-if="advancedStats?.team_stats" 
        :team-stats="advancedStats.team_stats" 
        :power-rankings="advancedStats.power_rankings" 
      />

      <!-- Power Rankings -->
      <MatchPowerRankings 
        v-if="advancedStats?.power_rankings" 
        :power-rankings="advancedStats.power_rankings" 
        :player-stats="advancedStats.player_stats" 
      />

      <!-- Timeline info -->
      <div v-if="timelineData && timelineData.Event && timelineData.Event.length > 0" class="p-4 glass rounded-2xl shadow-xl">
        <h4 class="text-sm text-slate-300 font-bold mb-4 text-center border-b border-white/5 pb-3">Linha do Tempo</h4>
        
        <MatchPitch :active-event="activeEvent" class="mb-6 rounded-xl overflow-hidden shadow-inner" />

        <ul class="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          <li 
            v-for="evento in events" 
            :key="evento.EventId" 
            class="text-sm text-white border-b border-white/5 pb-2 last:border-0 cursor-pointer p-3 rounded-xl transition-all duration-200"
            :class="{'bg-white/10 ring-1 ring-white/20': activeEvent?.EventId === evento.EventId, 'hover:bg-white/5': activeEvent?.EventId !== evento.EventId}"
            @mouseenter="pauseEventLoop(evento)"
            @mouseleave="resumeEventLoop"
            @click="pauseEventLoop(evento)"
          >
            <span class="font-black text-copa-green inline-block">{{ evento.MatchMinute }}</span>
            <span class="text-slate-200" v-html="formatEventDescription(evento.EventDescription?.[0]?.Description || evento.TypeLocalized?.[0]?.Description)"></span>
          </li>
        </ul>
      </div>
      <div v-else-if="!loadingTimeline" class="p-8 text-center glass rounded-2xl text-slate-400">
        <div class="text-4xl mb-3">⏱️</div>
        <p>Nenhum evento registrado nesta partida.</p>
      </div>
      <div v-else class="flex justify-center p-8">
        <svg class="animate-spin h-6 w-6 text-slate-500" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </div>
    <div v-else class="text-center py-20 text-slate-400">
      <p>Partida não encontrada.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useJogos } from '@/composables/useJogos'
import { getFlagUrl } from '@/utils/flags'
import MatchPitch from '@/components/MatchPitch.vue'
import MatchTeamStats from '@/components/MatchTeamStats.vue'
import MatchPowerRankings from '@/components/MatchPowerRankings.vue'

const route = useRoute()
const { jogosData, fetchResultados, resultados, fetchResultadoTimeline, fetchAdvancedStats } = useJogos()

const jogoId = Number(route.params.id)
const jogo = computed(() => jogosData.find(j => j.id === jogoId))
const resultado = computed(() => resultados.value[jogoId])

const loading = ref(true)
const loadingTimeline = ref(true)
const timelineData = ref(null)
const advancedStats = ref(null)
const activeEvent = ref(null)

const events = computed(() => timelineData.value?.Event?.slice()?.reverse() || [])

let eventLoopInterval = null;
let currentIndex = 0;

const startEventLoop = () => {
  if (eventLoopInterval) clearInterval(eventLoopInterval);
  if (events.value.length === 0) return;
  
  if (!activeEvent.value) {
    activeEvent.value = events.value[currentIndex];
  }
  
  eventLoopInterval = setInterval(() => {
    if (events.value.length === 0) return;
    currentIndex = (currentIndex + 1) % events.value.length;
    activeEvent.value = events.value[currentIndex];
  }, 4000);
}

const pauseEventLoop = (evento) => {
  if (eventLoopInterval) {
    clearInterval(eventLoopInterval);
    eventLoopInterval = null;
  }
  activeEvent.value = evento;
  
  const index = events.value.findIndex(e => e.EventId === evento.EventId);
  if (index !== -1) {
    currentIndex = index;
  }
}

const resumeEventLoop = () => {
  if (!eventLoopInterval && events.value.length > 0) {
    startEventLoop();
  }
}

watch(events, (newEvents) => {
  if (newEvents.length > 0 && !eventLoopInterval) {
    startEventLoop();
  }
}, { deep: true })

onMounted(async () => {
  await fetchResultados()
  loading.value = false
  
  if (jogo.value) {
    const [tData, aStats] = await Promise.all([
      fetchResultadoTimeline(jogoId),
      fetchAdvancedStats(jogoId)
    ])
    
    if (tData) {
      timelineData.value = tData
    }
    if (aStats) {
      advancedStats.value = aStats
    }
    loadingTimeline.value = false
  }
})

onUnmounted(() => {
  if (eventLoopInterval) clearInterval(eventLoopInterval)
})

const formattedDate = computed(() => {
  if (!jogo.value) return ''
  const date = new Date(jogo.value.data)
  return date.toLocaleDateString('pt-BR', { 
    weekday: 'short', 
    day: '2-digit', 
    month: 'long',
    hour: '2-digit', 
    minute: '2-digit'
  })
})

function formatEventDescription(description) {
  if (!description) return 'Evento'
  return description.replace(/\(([^)]+)\)/g, (match, countryName) => {
    let normalizedName = countryName;
    if (normalizedName === 'Curaçau') normalizedName = 'Curaçao';
    const flagUrl = getFlagUrl(normalizedName)
    if (flagUrl) {
      return `<img src="${flagUrl}" class="inline-block w-5 h-3.5 object-cover rounded-[2px] mx-1 shadow-sm align-middle" alt="${countryName}" title="${countryName}" />`
    }
    return match
  })
}
</script>
