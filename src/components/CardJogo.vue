<template>
  <div
    class="rounded-xl overflow-hidden transition-all duration-300 relative"
    :class="[
      coringa ? 'coringa-card' : 'glass',
      { 'ring-1 ring-copa-green/30': justSaved },
      (viewOnly || resultado?.finalizado) ? 'cursor-pointer hover:bg-white/5 hover:scale-[1.01]' : ''
    ]"
    @click="handleCardClick"
  >
    <!-- Game header: phase + time -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-white/5">
      <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate mr-2">
        {{ jogo.fase?.replace('Fase de Grupos - ', '') }}
      </span>
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Coringa badge -->
        <span
          v-if="coringa"
          class="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
        >
          <PhLightning :size="11" weight="fill" />
          CORINGA
        </span>

        <!-- Status badge -->
        <span
          v-if="resultado?.finalizado"
          class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300"
        >
          FINAL
        </span>
        <span
          v-else-if="isLive"
          class="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse-live"
        >
          <span>🔴 AO VIVO</span>
          <span v-if="currentMinute">{{ currentMinute }}'</span>
        </span>

        <span v-else class="text-[10px] text-slate-500">
          {{ formattedTime }}
        </span>
        <span v-if="(locked || futureLocked) && !resultado?.finalizado" class="text-sm">
          <PhLockSimple :size="18" />
        </span>
      </div>
    </div>

    <!-- Main content: teams + scores -->
    <div class="px-3 py-3">
      <div class="flex items-center gap-2">
        <!-- Home team -->
        <div 
          class="flex-1 flex flex-col justify-center items-center gap-1 sm:gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          @click.stop="$emit('team-click', jogo.mandante)"
        >
          <img v-if="getFlagUrl(jogo.mandante)" :src="getFlagUrl(jogo.mandante)" loading="lazy" class="w-7 h-5 sm:w-6 sm:h-4 object-cover rounded-sm shadow-sm" :alt="jogo.mandante" />          <span 
            class="text-[9px] sm:text-[11px] font-bold text-white leading-tight text-center"
            :title="jogo.mandante"
          >
            {{ truncateName(jogo.mandante) }}
          </span>
        </div>

        <!-- Score / Input area -->
        <div class="flex items-center gap-1.5 shrink-0">
          <!-- If game is finished or live/locked with a result, show result + user's prediction -->
          <template v-if="resultado?.finalizado || ((locked || futureLocked || viewOnly) && resultado)">
            <div class="flex flex-col items-center gap-1">
              <!-- Official result -->
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1">
                  <span class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 text-white font-black text-lg">
                    {{ resultado.gols_mandante }}
                  </span>
                  <span class="text-slate-500 text-xs font-bold">×</span>
                  <span class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 text-white font-black text-lg">
                    {{ resultado.gols_visitante }}
                  </span>
                </div>
                <div v-if="resultado.penaltis_mandante !== null && resultado.penaltis_visitante !== null" class="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-0.5">
                  <span>(P: {{ resultado.penaltis_mandante }})</span>
                  <span>-</span>
                  <span>(P: {{ resultado.penaltis_visitante }})</span>
                </div>
              </div>
              <!-- User's prediction (small) -->
              <div v-if="palpite" class="flex flex-col items-center gap-0.5 mt-1">
                <span
                  class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  :class="pontosClass"
                >
                  Seu: {{ palpite.gols_mandante }}-{{ palpite.gols_visitante }}
                  <template v-if="resultado.finalizado">· {{ pontosInfo }}pts</template>
                </span>
                <span v-if="palpite.vencedor_penaltis" class="text-[9px] text-slate-500 font-semibold mt-0.5">
                  Pênaltis: {{ truncateName(palpite.vencedor_penaltis === 'mandante' ? jogo.mandante : jogo.visitante) }}
                </span>
              </div>
            </div>
          </template>

          <!-- If game is live / locked / futureLocked (show prediction readonly) -->
          <template v-else-if="locked || futureLocked || viewOnly">
            <div class="flex flex-col items-center">
              <div class="flex items-center gap-1">
                <span class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 font-bold text-lg">
                  {{ palpite?.gols_mandante ?? '-' }}
                </span>
                <span class="text-slate-500 text-xs font-bold">×</span>
                <span class="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 font-bold text-lg">
                  {{ palpite?.gols_visitante ?? '-' }}
                </span>
              </div>
              <span v-if="palpite?.vencedor_penaltis" class="text-[9px] text-slate-500 font-semibold mt-0.5">
                Pênaltis: {{ truncateName(palpite.vencedor_penaltis === 'mandante' ? jogo.mandante : jogo.visitante) }}
              </span>
            </div>
          </template>

          <!-- Editable prediction -->
          <template v-else>
            <div class="flex flex-col items-center">
              <div class="flex items-center gap-1">
                <!-- Home goals -->
                <div class="flex items-center">
                  <button
                    @click="decrementHome"
                    class="w-7 h-9 flex items-center justify-center rounded-l-lg bg-slate-700 text-slate-300 font-bold text-sm tap-scale hover:bg-slate-600 active:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="localHome === 0"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    v-model.number="localHome"
                    min="0"
                    max="20"
                    placeholder="-"
                    class="w-9 h-9 text-center bg-slate-800 text-white font-black text-lg border-y border-copa-border focus:outline-none focus:bg-slate-700 transition-colors placeholder:text-slate-600"
                    @change="autoSave"
                  />
                  <button
                    @click="incrementHome"
                    class="w-7 h-9 flex items-center justify-center rounded-r-lg bg-slate-700 text-slate-300 font-bold text-sm tap-scale hover:bg-slate-600 active:bg-slate-500 transition-colors"
                  >
                    +
                  </button>
                </div>

                <span class="text-slate-500 text-xs font-bold mx-0.5">×</span>

                <!-- Away goals -->
                <div class="flex items-center">
                  <button
                    @click="decrementAway"
                    class="w-7 h-9 flex items-center justify-center rounded-l-lg bg-slate-700 text-slate-300 font-bold text-sm tap-scale hover:bg-slate-600 active:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="localAway === 0"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    v-model.number="localAway"
                    min="0"
                    max="20"
                    placeholder="-"
                    class="w-9 h-9 text-center bg-slate-800 text-white font-black text-lg border-y border-copa-border focus:outline-none focus:bg-slate-700 transition-colors placeholder:text-slate-600"
                    @change="autoSave"
                  />
                  <button
                    @click="incrementAway"
                    class="w-7 h-9 flex items-center justify-center rounded-r-lg bg-slate-700 text-slate-300 font-bold text-sm tap-scale hover:bg-slate-600 active:bg-slate-500 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Penalty Selection UI -->
              <div v-if="isMataMata && localHome !== '' && localHome === localAway" class="flex flex-col items-center mt-2 w-full">
                <span class="text-[10px] text-slate-400 font-semibold mb-1">Quem avança nos pênaltis?</span>
                <div class="flex gap-2 w-full justify-center">
                  <button 
                    @click="localVencedorPenaltis = 'mandante'; autoSave()"
                    class="flex-1 py-1 px-1 rounded-md text-[10px] font-bold border transition-colors max-w-[80px]"
                    :class="localVencedorPenaltis === 'mandante' ? 'bg-slate-700 text-white border-slate-500' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'"
                  >
                    {{ truncateName(jogo.mandante) }}
                  </button>
                  <button 
                    @click="localVencedorPenaltis = 'visitante'; autoSave()"
                    class="flex-1 py-1 px-1 rounded-md text-[10px] font-bold border transition-colors max-w-[80px]"
                    :class="localVencedorPenaltis === 'visitante' ? 'bg-slate-700 text-white border-slate-500' : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600'"
                  >
                    {{ truncateName(jogo.visitante) }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Away team -->
        <div 
          class="flex-1 flex flex-col justify-center items-center gap-1 sm:gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
          @click.stop="$emit('team-click', jogo.visitante)"
        >
          <img v-if="getFlagUrl(jogo.visitante)" :src="getFlagUrl(jogo.visitante)" loading="lazy" class="w-7 h-5 sm:w-6 sm:h-4 object-cover rounded-sm shadow-sm" :alt="jogo.visitante" />
          <span 
            class="text-[9px] sm:text-[11px] font-bold text-white leading-tight text-center"
            :title="jogo.visitante"
          >
            {{ truncateName(jogo.visitante) }}
          </span>
        </div>
      </div>

      <!-- Goal Scorers Area -->
      <div v-if="golsMandanteList.length || golsVisitanteList.length" class="flex justify-between px-2 mt-2 text-[10px] text-slate-400">
        <!-- Gols Mandante -->
        <div class="flex-1 flex flex-col items-end pr-3 border-r border-white/5 gap-0.5">
          <div v-for="gol in golsMandanteList" :key="gol.EventId" class="flex items-center gap-1">
            <span class="truncate max-w-[80px] sm:max-w-[100px]">{{ gol.playerName }}</span>
            <span class="text-copa-green font-bold shrink-0">{{ gol.MatchMinute }}'</span>
            <span class="shrink-0 text-[10px]">⚽️</span>
          </div>
        </div>
        
        <!-- Gols Visitante -->
        <div class="flex-1 flex flex-col items-start pl-3 gap-0.5">
          <div v-for="gol in golsVisitanteList" :key="gol.EventId" class="flex items-center gap-1">
            <span class="shrink-0 text-[10px]">⚽️</span>
            <span class="text-copa-green font-bold shrink-0">{{ gol.MatchMinute }}'</span>
            <span class="truncate max-w-[80px] sm:max-w-[100px]">{{ gol.playerName }}</span>
          </div>
        </div>
      </div>

      <!-- Odds Bar -->
      <div class="mt-3 px-2">
        <div class="flex items-center justify-between text-[10px] font-semibold mb-1">
          <span :style="{ color: colorMandante }">{{ percOdds.mandante }}%</span>
          <span class="text-slate-500">{{ percOdds.empate }}%</span>
          <span :style="{ color: colorVisitante }">{{ percOdds.visitante }}%</span>
        </div>
        <div class="flex w-full h-1.5 rounded-full overflow-hidden bg-slate-800 gap-px">
          <div :style="{ width: percOdds.mandante + '%', backgroundColor: colorMandante }" class="h-full transition-all duration-500 rounded-l-full"></div>
          <div :style="{ width: percOdds.empate + '%', backgroundColor: '#64748b' }" class="h-full transition-all duration-500"></div>
          <div :style="{ width: percOdds.visitante + '%', backgroundColor: colorVisitante }" class="h-full transition-all duration-500 rounded-r-full"></div>
        </div>
      </div>

      <!-- Stadium info & Weather -->
      <div class="flex items-center justify-center gap-2 mt-3">
        <span class="text-[10px] text-slate-600">{{ jogo.estadio }}</span>
        <div v-if="weather" class="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full border border-white/5" :title="weather.description">
          <img :src="`https://openweathermap.org/img/wn/${weather.icon}.png`" :alt="weather.description" class="w-4 h-4 object-contain" />
          <span class="font-medium">{{ weather.temp }}°C</span>
        </div>
      </div>

      <!-- Timeline info for live matches -->
      <div v-if="timelineData && timelineData.Event && isLive" class="mt-4 p-2 bg-slate-800 rounded-lg">
        <h4 class="text-xs text-slate-400 font-bold mb-2 text-center">Linha do Tempo (Ao Vivo)</h4>
        
        <MatchPitch :active-event="activeEvent" class="mb-3" />

        <ul class="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
          <li 
            v-for="evento in events" 
            :key="evento.EventId" 
            class="text-[10px] text-white border-b border-white/5 pb-1 last:border-0 cursor-pointer p-1.5 rounded transition-colors"
            :class="{'bg-white/10': activeEvent?.EventId === evento.EventId, 'hover:bg-white/5': activeEvent?.EventId !== evento.EventId}"
            @mouseenter="pauseEventLoop(evento)"
            @mouseleave="resumeEventLoop"
            @click="pauseEventLoop(evento)"
          >
            <span class="font-bold text-copa-green">{{ evento.MatchMinute }}</span> - 
            <span v-html="formatEventDescription(evento)"></span>
          </li>
        </ul>
      </div>

      <!-- Palpites da Galera Button -->
      <div v-if="locked || resultado?.finalizado" class="mt-4">
        <button 
          @click.stop="showPalpitesModal = true"
          class="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold border border-white/5 hover:bg-slate-700 transition-colors tap-scale"
        >
          <span class="text-lg">👀</span> Ver Palpites da Galera
        </button>
      </div>

      <!-- Future Locked message -->
      <div v-else-if="futureLocked && !viewOnly && !resultado?.finalizado" class="mt-4 text-center">
        <p class="text-xs font-medium text-slate-500 bg-slate-800/50 py-2 rounded-lg border border-slate-700/50">Palpites liberam dia {{ dataLiberacaoPalpite }}</p>
      </div>
    </div>

    <!-- Save button (only when editable and changed) -->
    <Transition enter-active-class="animate-slide-up">
      <div
        v-if="!locked && !futureLocked && !viewOnly && !resultado?.finalizado && hasChanged"
        class="px-3 pb-3"
      >
        <button
          @click="save"
          :disabled="saving"
          class="w-full py-2.5 rounded-lg bg-copa-green text-white text-sm font-bold tap-scale transition-all duration-200 hover:bg-copa-green-dark disabled:opacity-50"
        >
          <span v-if="saving" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Salvando...
          </span>
          <span v-else>Salvar Palpite ✓</span>
        </button>
      </div>
    </Transition>

    <PalpitesDaGaleraModal
      :show="showPalpitesModal"
      :jogo="jogo"
      :resultado="resultado"
      @close="showPalpitesModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useJogos } from '@/composables/useJogos'
import { getFlagUrl } from '@/utils/flags'
import { getFlagColor } from '@/utils/colors'
import { PhLockSimple, PhLightning } from '@phosphor-icons/vue'
import MatchPitch from '@/components/MatchPitch.vue'
import PalpitesDaGaleraModal from '@/components/PalpitesDaGaleraModal.vue'

const props = defineProps({
  jogo: { type: Object, required: true },
  palpite: { type: Object, default: null },
  resultado: { type: Object, default: null },
  odd: { type: Object, default: null },
  coringa: { type: Boolean, default: false },
  weather: { type: Object, default: null },
  locked: { type: Boolean, default: false },
  futureLocked: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  viewOnly: { type: Boolean, default: false },
})

const emit = defineEmits(['salvar', 'team-click'])

const dataLiberacaoPalpite = computed(() => {
  if (!props.jogo?.data) return ''
  const date = new Date(props.jogo.data)
  date.setDate(date.getDate() - 1)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
})
const { calcularPontos, tempoAteBloquear, fetchResultadoTimeline } = useJogos()
const router = useRouter()

function handleCardClick() {
  if (props.viewOnly) return; // parent handles it
  if (props.resultado?.finalizado) {
    router.push(`/jogos/${props.jogo.id}/estatisticas`);
  }
}

const localHome = ref(props.palpite ? props.palpite.gols_mandante : '')
const localAway = ref(props.palpite ? props.palpite.gols_visitante : '')
const localVencedorPenaltis = ref(props.palpite ? props.palpite.vencedor_penaltis : null)
const justSaved = ref(false)
const showPalpitesModal = ref(false)

const isMataMata = computed(() => {
  return props.jogo.fase && !props.jogo.fase.includes('Fase de Grupos')
})

const timelineData = ref(null)
const activeEvent = ref(null)
let pollInterval = null

const isLive = computed(() => {
  if (props.resultado?.finalizado) return false
  const kickoff = new Date(props.jogo.data).getTime()
  const now = Date.now()
  // Um jogo é considerado ao vivo se passou do horário de início 
  // e ainda está dentro de uma janela de 4 horas (14400000 ms)
  return now >= kickoff && now <= kickoff + 4 * 60 * 60 * 1000
})

const events = computed(() => timelineData.value?.Event?.slice()?.reverse() || [])

const currentMinute = computed(() => {
  if (events.value.length === 0) return ''
  return events.value[0].MatchMinute
})

const golsMandanteList = computed(() => {
  return extractGols(props.jogo.mandante);
});

const golsVisitanteList = computed(() => {
  return extractGols(props.jogo.visitante);
});

function extractGols(teamName) {
  if (!timelineData.value?.Event) return [];
  
  const gols = [];
  const chronologicalEvents = timelineData.value.Event || [];
  
  for (const evento of chronologicalEvents) {
    const description = evento?.EventDescription?.[0]?.Description || evento?.TypeLocalized?.[0]?.Description;
    if (!description) continue;
    
    const descLower = description.toLowerCase();
    const isGoal = (evento.Type === 0) || 
                   (evento.TypeLocalized?.[0]?.Description?.toLowerCase().includes('marca o gol')) || 
                   descLower.includes('marca o gol');
                   
    if (isGoal) {
      let eventTeam = null;
      let playerName = "Jogador";
      
      const match = description.match(/\(([^)]+)\)/);
      if (match) {
        eventTeam = match[1];
        if (eventTeam === 'Curaçau') eventTeam = 'Curaçao';
        playerName = description.substring(0, match.index).trim();
      } else {
        const idx = descLower.indexOf('marca o gol');
        if (idx !== -1) {
          playerName = description.substring(0, idx).trim();
        }
      }
      
      const isThisTeam = (eventTeam === teamName) || 
                         (evento.TeamName === teamName) || 
                         (evento.TeamName && evento.TeamName[0]?.Description === teamName);
                         
      if (isThisTeam) {
        gols.push({
          EventId: evento.EventId || Math.random(),
          MatchMinute: evento.MatchMinute,
          playerName: playerName
        });
      }
    }
  }
  return gols;
}

let eventLoopInterval = null;

let currentIndex = 0;

const startEventLoop = () => {
  if (eventLoopInterval) clearInterval(eventLoopInterval);
  if (events.value.length === 0) return;
  
  // Only initialize with first event if we don't have an active event
  if (!activeEvent.value) {
    activeEvent.value = events.value[currentIndex];
  }
  
  eventLoopInterval = setInterval(() => {
    if (events.value.length === 0) return;
    currentIndex = (currentIndex + 1) % events.value.length;
    activeEvent.value = events.value[currentIndex];
  }, 4000); // 4 seconds per event
}

const pauseEventLoop = (evento) => {
  if (eventLoopInterval) {
    clearInterval(eventLoopInterval);
    eventLoopInterval = null;
  }
  activeEvent.value = evento;
  
  // Update currentIndex to match the hovered event
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


async function pollTimeline() {
  if (isLive.value) {
    const data = await fetchResultadoTimeline(props.jogo.id)
    if (data) timelineData.value = data
  }
}

watch(isLive, (newVal) => {
  if (newVal && !pollInterval) {
    pollTimeline()
    pollInterval = setInterval(pollTimeline, 60000)
  } else if (!newVal && pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}, { immediate: true })

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (eventLoopInterval) clearInterval(eventLoopInterval)
})

// Watch for palpite changes (e.g., after save)
watch(() => props.palpite, (newVal) => {
  if (newVal) {
    localHome.value = newVal.gols_mandante
    localAway.value = newVal.gols_visitante
    localVencedorPenaltis.value = newVal.vencedor_penaltis
  } else {
    localHome.value = ''
    localAway.value = ''
    localVencedorPenaltis.value = null
  }
}, { deep: true })

const formattedTime = computed(() => {
  const date = new Date(props.jogo.data)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
})

const colorMandante = computed(() => getFlagColor(props.jogo.mandante))
const colorVisitante = computed(() => getFlagColor(props.jogo.visitante))

const percOdds = computed(() => {
  if (!props.odd) return { mandante: 33, empate: 34, visitante: 33 }
  const vM = props.odd.votos_mandante || 0
  const vV = props.odd.votos_visitante || 0
  const vE = props.odd.votos_empate || 0
  const total = vM + vV + vE
  if (total === 0) return { mandante: 33, empate: 34, visitante: 33 }
  const mandante = Math.round((vM / total) * 100)
  const empate = Math.round((vE / total) * 100)
  const visitante = 100 - mandante - empate
  return { mandante, empate, visitante }
})

const hasChanged = computed(() => {
  if (!props.palpite) {
    if (localHome.value === '' || localAway.value === '') return false
    if (isMataMata.value && localHome.value === localAway.value && !localVencedorPenaltis.value) return false
    return true
  }
  const golsChanged = localHome.value !== props.palpite.gols_mandante || localAway.value !== props.palpite.gols_visitante;
  const penaltyChanged = isMataMata.value && localHome.value === localAway.value && localVencedorPenaltis.value !== props.palpite.vencedor_penaltis;
  
  if (isMataMata.value && localHome.value === localAway.value && !localVencedorPenaltis.value) return false;

  return golsChanged || penaltyChanged
})

const pontosInfo = computed(() => {
  if (!props.resultado?.finalizado || !props.palpite) return null
  return props.palpite.pontuacao
})

const pontosClass = computed(() => {
  const pts = pontosInfo.value

  // Negativo (erro em coringa)
  if (pts !== null && pts < 0) return 'bg-red-500/20 text-red-400'

  if (pts === 0) return 'bg-red-500/20 text-red-400'

  // Acertou resultado ou pênaltis parciais
  if (pts === 3 || pts === 6 || pts === 5) return 'bg-copa-green/20 text-copa-green'

  // Placar exato ou pênaltis perfeitos
  if (pts === 7 || pts === 10 || pts === 14) return 'bg-copa-gold/20 text-copa-gold'

  return 'bg-slate-700 text-slate-400'
})

function incrementHome() {
  let val = localHome.value === '' ? -1 : localHome.value
  localHome.value = Math.min(20, val + 1)
}
function decrementHome() {
  let val = localHome.value === '' ? 1 : localHome.value
  localHome.value = Math.max(0, val - 1)
}
function incrementAway() {
  let val = localAway.value === '' ? -1 : localAway.value
  localAway.value = Math.min(20, val + 1)
}
function decrementAway() {
  let val = localAway.value === '' ? 1 : localAway.value
  localAway.value = Math.max(0, val - 1)
}

function autoSave() {
  // Clamp values
  if (localHome.value !== '') {
    localHome.value = Math.max(0, Math.min(20, localHome.value))
  }
  if (localAway.value !== '') {
    localAway.value = Math.max(0, Math.min(20, localAway.value))
  }
}

async function save() {
  emit('salvar', {
    jogoId: props.jogo.id,
    golsMandante: localHome.value,
    golsVisitante: localAway.value,
    vencedorPenaltis: isMataMata.value && localHome.value === localAway.value ? localVencedorPenaltis.value : null
  })
  justSaved.value = true
  setTimeout(() => { justSaved.value = false }, 2000)
}

function truncateName(name) {
  if (!name) return ''
  return name.length > 8 ? name.substring(0, 8) + '...' : name
}

function formatEventDescription(evento) {
  const description = evento?.EventDescription?.[0]?.Description || evento?.TypeLocalized?.[0]?.Description;
  if (!description) return 'Evento'
  
  let desc = description
  
  if (desc.includes("sai do banco para substituir")) {
    desc = desc.replace(/\s*sai do banco para substituir\s*/g, " ")
  }
  
  desc = desc.replace(/\(entra\)/gi, '<span class="text-copa-green font-bold px-0.5">↑</span>')
  desc = desc.replace(/\(sai\)/gi, '<span class="text-red-500 font-bold px-0.5">↓</span>')

  desc = desc.replace(/\(([^)]+)\)/g, (match, countryName) => {
    let normalizedName = countryName;
    if (normalizedName === 'Curaçau') normalizedName = 'Curaçao';
    const flagUrl = getFlagUrl(normalizedName)
    if (flagUrl) {
      return `<img src="${flagUrl}" class="inline-block w-4 h-3 object-cover rounded-[2px] mx-0.5 shadow-sm align-middle" alt="${countryName}" title="${countryName}" />`
    }
    return match
  })

  const descLower = desc.toLowerCase();
  const isGoal = (evento.Type === 0) || 
                 (evento.TypeLocalized?.[0]?.Description?.toLowerCase().includes('marca o gol')) || 
                 descLower.includes('marca o gol');
  
  if (isGoal) {
    desc = `⚽️ <span class="font-bold">${desc}</span>`;
  }

  return desc
}
</script>
