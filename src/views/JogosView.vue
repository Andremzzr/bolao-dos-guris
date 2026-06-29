<template>
  <div class="pb-20 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3">
        <div class="flex items-center justify-between">
          <div v-if="!hasLiveGame">
            <p class="text-xs text-slate-400">Copa do Mundo 2026</p>
          </div>
          <span v-else @click="scrollToLiveGame" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse-live"> 🔴 AO VIVO </span>

          <div class="flex items-center gap-2">
            <!-- Filter buttons -->
            <button
              v-for="filter in filters"
              :key="filter.value"
              @click="activeFilter = filter.value"
              class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 tap-scale"
              :class="[
                activeFilter === filter.value
                  ? 'bg-copa-accent text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              ]"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="initialLoading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-copa-accent" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Games list grouped by date -->
    <div v-else class="px-3 py-3 space-y-4">
      <div
        v-for="(jogos, data) in filteredJogosPorData"
        :key="data"
        class="animate-fade-in"
      >
        <!-- Date header -->
        <div class="sticky top-[68px] z-20 py-2">
          <div class="inline-flex items-center px-3 py-1 rounded-full bg-slate-800/90 backdrop-blur-sm border border-copa-border text-xs font-semibold text-slate-300 capitalize">
            <PhCalendar class="mr-1" :size="16" />
            <p>
              {{ data }}
            </p>
          </div>
        </div>

        <!-- Game cards -->
        <div class="space-y-2.5 mt-2">
          <CardJogo
            v-for="jogo in jogos"
            :key="jogo.id"
            :id="'jogo-' + jogo.id"
            :jogo="jogo"
            :palpite="palpites[jogo.id]"
            :resultado="resultados[jogo.id]"
            :odd="odds[jogo.id]"
            :coringa="!!coringaMap[jogo.id]"
            :weather="weatherMap[jogo.estadio]"
            :locked="isLocked(jogo)"
            :future-locked="isFutureLocked(jogo)"
            :saving="saving[jogo.id]"
            @salvar="onSalvarPalpite"
            @team-click="openTeamModal"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="Object.keys(filteredJogosPorData).length === 0" class="text-center py-16">
        <div class="text-4xl mb-3">🔍</div>
        <p class="text-slate-400 font-medium">Nenhum jogo encontrado</p>
        <p class="text-slate-500 text-sm mt-1">Tente outro filtro</p>
      </div>
    </div>

    <!-- Team Modal -->
    <Transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" @click.self="closeTeamModal">
        <div class="bg-slate-900 border border-slate-700 w-full max-w-lg max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
          <!-- Close button overlay -->
          <button @click="closeTeamModal" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10">
            ✕
          </button>
          
          <!-- Header -->
          <div class="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
             <img :src="getFlagUrl(selectedTeam)" class="w-8 h-6 object-cover rounded shadow" />
             <h3 class="text-lg font-bold text-white">{{ selectedTeam }}</h3>
          </div>

          <!-- Content (Scrollable list of matches) -->
          <div class="overflow-y-auto p-4 space-y-3 custom-scrollbar flex-1 bg-slate-950">
            <CardJogo
              v-for="jogo in teamGames"
              :key="jogo.id"
              :id="'modal-jogo-' + jogo.id"
              :jogo="jogo"
              :palpite="palpites[jogo.id]"
              :resultado="resultados[jogo.id]"
              :odd="odds[jogo.id]"
              :coringa="!!coringaMap[jogo.id]"
              :weather="weatherMap[jogo.estadio]"
              :locked="isLocked(jogo)"
              :future-locked="isFutureLocked(jogo)"
              :saving="saving[jogo.id]"
              :viewOnly="true"
              @click="scrollToMatchFromModal(jogo.id)"
              @salvar="onSalvarPalpite"
              @team-click="openTeamModal" 
            />
            <div v-if="teamGames.length === 0" class="text-center py-8 text-slate-400">
              Nenhum jogo encontrado para esta equipe.
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useJogos } from '@/composables/useJogos'
import { useWeather } from '@/composables/useWeather'
import CardJogo from '@/components/CardJogo.vue'
import { getFlagUrl } from '@/utils/flags'
import { PhCalendar } from '@phosphor-icons/vue'

import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const {
  jogosPorData,
  jogosOrdenados,
  resultados,
  palpites,
  odds,
  coringaMap,
  isLocked,
  isFutureLocked,
  saving,
  fetchResultados,
  fetchPalpites,
  fetchOdds,
  fetchCoringaJogos,
  salvarPalpite,
  statusJogo,
} = useJogos()

const { fetchWeatherForToday, weatherMap } = useWeather()

const initialLoading = ref(true)
const activeFilter = ref('todos')

const selectedTeam = ref(null)
const isModalOpen = ref(false)

const teamGames = computed(() => {
  if (!selectedTeam.value) return []
  return jogosOrdenados.value.filter(j => j.mandante === selectedTeam.value || j.visitante === selectedTeam.value)
})

function openTeamModal(team) {
  selectedTeam.value = team
  isModalOpen.value = true
}

function closeTeamModal() {
  isModalOpen.value = false
  setTimeout(() => {
    selectedTeam.value = null
  }, 300)
}

function scrollToMatch(jogoId, delay = 0) {
  setTimeout(() => {
    const el = document.getElementById(`jogo-${jogoId}`)
    if (el) {
      // Temporarily highlight the target element
      el.classList.add('ring-2', 'ring-copa-accent', 'scale-[1.02]', 'transition-all', 'duration-500')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-copa-accent', 'scale-[1.02]')
      }, 2000)

      const headerOffset = 120
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }, delay)
}

function scrollToMatchFromModal(jogoId) {
  closeTeamModal()
  scrollToMatch(jogoId, 350)
}

const filters = [
  { label: 'Todos', value: 'todos' },
  { label: 'Abertos', value: 'abertos' },
  { label: 'Finalizados', value: 'finalizados' },
]

const filteredJogosPorData = computed(() => {
  if (activeFilter.value === 'todos') return jogosPorData.value

  const filtered = {}
  for (const [data, jogos] of Object.entries(jogosPorData.value)) {
    const filteredJogos = jogos.filter(jogo => {
      const status = statusJogo(jogo)
      if (activeFilter.value === 'abertos') return status === 'agendado'
      if (activeFilter.value === 'finalizados') return status === 'finalizado'
      return true
    })
    if (filteredJogos.length > 0) {
      filtered[data] = filteredJogos
    }
  }
  return filtered
})

const hasLiveGame = computed(() => {
  if (initialLoading.value) return false;
  return jogosOrdenados.value.length >0 && jogosOrdenados.value.find(j => statusJogo(j) === 'em_andamento')
})

function scrollToLiveGame() {
  if (activeFilter.value !== 'todos') return

  let targetJogo = jogosOrdenados.value.find(j => statusJogo(j) === 'em_andamento')
  
  if (!targetJogo) {
    targetJogo = jogosOrdenados.value.find(j => statusJogo(j) === 'agendado')
  }

  if (targetJogo) {
    nextTick(() => {
      const el = document.getElementById(`jogo-${targetJogo.id}`)
      if (el) {
        const headerOffset = 120
        const elementPosition = el.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.scrollY - headerOffset
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    })
  }
}

onMounted(async () => {
  await Promise.all([
    fetchResultados(),
    fetchPalpites(user.value?.id),
    fetchOdds(),
    fetchCoringaJogos(),
  ])
  initialLoading.value = false
  
  nextTick(() => {
    if (route.query.scrollTo) {
      scrollToMatch(route.query.scrollTo, 100)
      const newQuery = { ...route.query }
      delete newQuery.scrollTo
      router.replace({ query: newQuery })
    } else {
      scrollToLiveGame()
    }
  })

  const today = new Date().toLocaleDateString('pt-BR')
  const jogosDeHoje = jogosOrdenados.value.filter(j => new Date(j.data).toLocaleDateString('pt-BR') === today)
  if (jogosDeHoje.length > 0) {
    fetchWeatherForToday(jogosDeHoje)
  }
})

watch(activeFilter, (newVal) => {
  if (newVal === 'todos') {
    // Need a slight delay or nextTick for Vue to render the 'todos' list if it was hidden
    nextTick(() => {
      scrollToLiveGame()
    })
  }
})

async function onSalvarPalpite({ jogoId, golsMandante, golsVisitante, vencedorPenaltis }) {
  await salvarPalpite(user.value.id, jogoId, golsMandante, golsVisitante, vencedorPenaltis)
}
</script>
