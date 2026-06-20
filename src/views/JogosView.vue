<template>
  <div class="pb-20 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400">Copa do Mundo 2026</p>
          </div>
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
            📅 {{ data }}
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
            :locked="isLocked(jogo)"
            :saving="saving[jogo.id]"
            @salvar="onSalvarPalpite"
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useJogos } from '@/composables/useJogos'
import CardJogo from '@/components/CardJogo.vue'

const { user } = useAuth()
const {
  jogosPorData,
  jogosOrdenados,
  resultados,
  palpites,
  odds,
  isLocked,
  saving,
  fetchResultados,
  fetchPalpites,
  fetchOdds,
  salvarPalpite,
  statusJogo,
} = useJogos()

const initialLoading = ref(true)
const activeFilter = ref('todos')

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
  ])
  initialLoading.value = false
  scrollToLiveGame()
})

watch(activeFilter, (newVal) => {
  if (newVal === 'todos') {
    // Need a slight delay or nextTick for Vue to render the 'todos' list if it was hidden
    nextTick(() => {
      scrollToLiveGame()
    })
  }
})

async function onSalvarPalpite({ jogoId, golsMandante, golsVisitante }) {
  await salvarPalpite(user.value.id, jogoId, golsMandante, golsVisitante)
}
</script>
