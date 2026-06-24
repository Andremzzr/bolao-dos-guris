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
            v-for="palpite in sortedPalpites"
            :key="palpite.usuario_id"
            class="glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200"
            :class="getPalpiteState(palpite).rowClass"
          >
            <!-- Avatar -->
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center border shrink-0"
              :class="getPalpiteState(palpite).avatarClass"
            >
              <span class="text-xs font-black" :class="getPalpiteState(palpite).avatarTextClass">
                {{ getPalpiteState(palpite).avatarIcon ?? palpite.nome?.charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- Name + label -->
            <div class="flex-1 min-w-0">
              <div class="font-bold text-sm truncate" :class="getPalpiteState(palpite).nameClass">
                {{ palpite.nome }}
              </div>
              <div v-if="getPalpiteState(palpite).label" class="text-[10px] font-semibold mt-0.5" :class="getPalpiteState(palpite).labelClass">
                {{ getPalpiteState(palpite).label }}
              </div>
            </div>

            <!-- Score bubble -->
            <div
              class="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              :class="getPalpiteState(palpite).bubbleClass"
            >
              <span class="font-black text-sm" :class="getPalpiteState(palpite).scoreTextClass">{{ palpite.gols_mandante }}</span>
              <span class="font-bold text-xs" :class="getPalpiteState(palpite).separatorClass">×</span>
              <span class="font-black text-sm" :class="getPalpiteState(palpite).scoreTextClass">{{ palpite.gols_visitante }}</span>
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

// ---------------------------------------------------------------------------
// Estado centralizado — adicione novos estados aqui
// ---------------------------------------------------------------------------

/**
 * Retorna a "chave de estado" de um palpite. Prioridade top-down:
 *   'exato'     — placar bate exatamente com o resultado atual
 *   'vencedor'  — acertou quem ganhou ou empate
 *   'eliminado' — errou o palpite
 *
 * Para jogos finalizados, usamos calcularPontos para estados baseados em pontos.
 */
function getPalpiteStatus(palpite) {
  if (!isLiveOrFinished.value || !props.resultado || !props.jogo) return 'default'

  const rm = Number(props.resultado.gols_mandante)
  const rv = Number(props.resultado.gols_visitante)
  const pm = Number(palpite.gols_mandante)
  const pv = Number(palpite.gols_visitante)

  if (rm === pm && rv === pv) return 'exato'
  if (Math.sign(pm - pv) === Math.sign(rm - rv)) return 'vencedor'

  return 'eliminado'
}

/**
 * Mapa de estados → aparência visual.
 * Para adicionar um novo estado, basta inserir uma entrada aqui.
 */
const STATE_STYLES = {
  default: {
    rowClass:        '',
    avatarClass:     'bg-slate-800 border-slate-700',
    avatarTextClass: 'text-white',
    avatarIcon:      null,
    nameClass:       'text-white',
    label:           null,
    labelClass:      '',
    bubbleClass:     'bg-slate-800/80',
    scoreTextClass:  'text-white',
    separatorClass:  'text-slate-500',
  },
  eliminado: {
    rowClass:        'ring-1 ring-red-500/30 bg-red-500/10 opacity-60',
    avatarClass:     'bg-red-900/40 border-red-500/40',
    avatarTextClass: 'text-red-400',
    avatarIcon:      '✗',
    nameClass:       'text-red-300',
    label:           'Errou',
    labelClass:      'text-red-500/80',
    bubbleClass:     'bg-red-900/30 ring-1 ring-red-500/30',
    scoreTextClass:  'text-red-400',
    separatorClass:  'text-red-600',
  },
  vencedor: {
    rowClass:        'ring-1 ring-emerald-400/40 bg-emerald-500/10',
    avatarClass:     'bg-emerald-900/40 border-emerald-400/50',
    avatarTextClass: 'text-emerald-300',
    avatarIcon:      '✓',
    nameClass:       'text-emerald-200',
    label:           'Acertou Vencedor',
    labelClass:      'text-emerald-400/90',
    bubbleClass:     'bg-emerald-900/30 ring-1 ring-emerald-400/40',
    scoreTextClass:  'text-emerald-300',
    separatorClass:  'text-emerald-600',
  },
  exato: {
    rowClass:        'ring-1 ring-amber-400/40 bg-amber-500/10',
    avatarClass:     'bg-amber-900/40 border-amber-400/50',
    avatarTextClass: 'text-amber-300',
    avatarIcon:      '★',
    nameClass:       'text-amber-200',
    label:           'Resultado Exato!',
    labelClass:      'text-amber-400/90',
    bubbleClass:     'bg-amber-900/30 ring-1 ring-amber-400/40',
    scoreTextClass:  'text-amber-300',
    separatorClass:  'text-amber-600',
  },
}

/** Retorna o objeto de estilos para o palpite. */
function getPalpiteState(palpite) {
  const status = getPalpiteStatus(palpite)
  return STATE_STYLES[status] ?? STATE_STYLES.default
}

// ---------------------------------------------------------------------------
// Ordenação
// ---------------------------------------------------------------------------

function getPoints(palpite) {
  if (!props.resultado) return null
  const calc = calcularPontos(palpite, props.resultado)
  return calc ? calc.pontos : 0
}

/** Peso de ordenação: exato > outros possíveis > eliminado */
function getSortWeight(palpite) {
  const status = getPalpiteStatus(palpite)
  if (status === 'exato')     return 0
  if (status === 'vencedor')  return 1
  if (status === 'eliminado') return 3
  return 2
}

const sortedPalpites = computed(() => {
  if (!isLiveOrFinished.value || !props.resultado) {
    return [...palpitesList.value].sort((a, b) => a.nome.localeCompare(b.nome))
  }
  return [...palpitesList.value].sort((a, b) => {
    const wA = getSortWeight(a)
    const wB = getSortWeight(b)
    if (wA !== wB) return wA - wB
    return a.nome.localeCompare(b.nome)
  })
})

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

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
