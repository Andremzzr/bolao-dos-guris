<template>
  <Teleport to="body">
    <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="bg-slate-900 border border-slate-700 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative rounded-2xl">
        <!-- Close button overlay -->
        <button @click="$emit('close')" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10">
          ✕
        </button>
        
        <!-- Header -->
        <div class="pl-5 pr-12 py-4 border-b border-slate-800 flex items-center justify-center gap-3 sm:gap-4">
          <div class="flex items-center justify-end gap-2 flex-1 min-w-0">
            <span class="text-white font-bold truncate text-sm sm:text-base" :title="jogo?.mandante">{{ jogo?.mandante }}</span>
            <img v-if="getFlagUrl(jogo?.mandante)" :src="getFlagUrl(jogo?.mandante)" class="w-6 h-4 object-cover rounded shadow-sm shrink-0" />
          </div>
          <span class="text-slate-500 font-bold text-sm shrink-0">x</span>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <img v-if="getFlagUrl(jogo?.visitante)" :src="getFlagUrl(jogo?.visitante)" class="w-6 h-4 object-cover rounded shadow-sm shrink-0" />
            <span class="text-white font-bold truncate text-sm sm:text-base" :title="jogo?.visitante">{{ jogo?.visitante }}</span>
          </div>
        </div>

        <div class="px-5 py-2 bg-slate-800/50 flex items-center justify-between border-b border-slate-800/50">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Palpites da Galera</h3>
          <span v-if="loading" class="text-xs text-slate-500">Carregando...</span>
          <span v-else class="text-xs text-slate-500">{{ sortedPalpites.length }} palpites</span>
        </div>

        <!-- Content (Scrollable list of palpites) -->
        <div class="overflow-y-auto p-4 space-y-2 custom-scrollbar flex-1 bg-slate-950">
          
          <div v-if="loading" class="flex justify-center py-8">
            <svg class="animate-spin h-6 w-6 text-copa-accent" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>

          <div v-else-if="sortedPalpites.length === 0" class="text-center py-8 text-slate-500 text-sm">
            Ninguém palpitou nesse jogo ainda.
          </div>

          <div
            v-else
            v-for="(palpite, index) in sortedPalpites"
            :key="palpite.usuario_id"
            class="glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200"
            :class="[getHighlightClass(palpite)]"
          >
            <!-- Avatar -->
            <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
              <span class="text-xs font-black text-white">
                {{ palpite.nome?.charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- Name -->
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm text-white truncate">
                {{ palpite.nome }}
              </div>
            </div>

            <!-- Palpite -->
            <div class="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg">
              <span class="text-white font-black text-sm">{{ palpite.gols_mandante }}</span>
              <span class="text-slate-500 font-bold text-xs">×</span>
              <span class="text-white font-black text-sm">{{ palpite.gols_visitante }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useJogos } from '@/composables/useJogos'
import { getFlagUrl } from '@/utils/flags'

const props = defineProps({
  show: { type: Boolean, default: false },
  jogo: { type: Object, default: null },
  resultado: { type: Object, default: null },
})

defineEmits(['close'])

const { fetchPalpitesDaGalera, calcularPontos } = useJogos()
const palpitesList = ref([])
const loading = ref(false)

const isLiveOrFinished = computed(() => {
  if (!props.jogo) return false
  const kickoff = new Date(props.jogo.data).getTime()
  return Date.now() >= kickoff || props.resultado?.finalizado
})

function getPoints(palpite) {
  if (!props.resultado) return null
  const calc = calcularPontos(palpite, props.resultado)
  return calc ? calc.pontos : 0
}

function getPointsColor(palpite) {
  const pts = getPoints(palpite)
  if (pts === 25 || pts === 18) return 'text-copa-gold'
  if (pts === 10) return 'text-copa-green'
  return 'text-slate-500'
}

function getHighlightClass(palpite) {
  if (!isLiveOrFinished.value) return ''
  const pts = getPoints(palpite)
  if (pts === 25 || pts === 18) return 'ring-1 ring-copa-gold/40 bg-copa-gold/5'
  if (pts === 10) return 'ring-1 ring-copa-green/30 bg-copa-green/5'
  return ''
}

const sortedPalpites = computed(() => {
  if (!isLiveOrFinished.value || !props.resultado) {
    return [...palpitesList.value].sort((a, b) => a.nome.localeCompare(b.nome))
  }
  return [...palpitesList.value].sort((a, b) => {
    const ptsA = getPoints(a) || 0
    const ptsB = getPoints(b) || 0
    if (ptsA !== ptsB) return ptsB - ptsA
    return a.nome.localeCompare(b.nome)
  })
})

watch(() => props.show, async (newVal) => {
  if (newVal && props.jogo) {
    loading.value = true
    palpitesList.value = await fetchPalpitesDaGalera(props.jogo.id)
    loading.value = false
  } else {
    palpitesList.value = []
  }
})
</script>
