<template>
  <div class="h-[100dvh] pb-20 flex flex-col">
    <!-- Header -->
    <header class="shrink-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3 flex gap-2">
        <PhTrophy :size="28" />
        <h1 class="text-lg font-bold text-white">Classificação</h1>
      </div>

      <!-- Tabs -->
      <div class="px-4 flex gap-4 mt-2">
        <button
          class="pb-2 text-sm font-bold border-b-2 transition-colors"
          :class="activeTab === 'tops' ? 'border-copa-accent text-white' : 'border-transparent text-slate-400 hover:text-slate-300'"
          @click="activeTab = 'tops'"
        >
          Tops
        </button>
        <button
          class="pb-2 text-sm font-bold border-b-2 transition-colors"
          :class="activeTab === 'geral' ? 'border-copa-accent text-white' : 'border-transparent text-slate-400 hover:text-slate-300'"
          @click="activeTab = 'geral'"
        >
          Geral
        </button>
        <button
          class="pb-2 text-sm font-bold border-b-2 transition-colors"
          :class="activeTab === 'diario' ? 'border-copa-accent text-white' : 'border-transparent text-slate-400 hover:text-slate-300'"
          @click="activeTab = 'diario'"
        >
          Diário
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isDisplayedLoading" class="flex-1 flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-copa-accent" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Main Content Area -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      
      <!-- TOPS VIEW -->
      <div v-if="activeTab === 'tops'" class="flex-1 overflow-y-auto px-3 pb-6 pt-3 space-y-4">
        <!-- Podium Top 3 -->
        <div class="pt-8 pb-4" v-if="ranking.length > 0">
          <div class="flex justify-center items-end h-40 px-2">
            <!-- Segundo Lugar (2) -->
            <div class="flex flex-col items-center justify-end w-[30%]">
               <div class="relative w-14 h-14 rounded-full border-2 border-copa-silver bg-slate-800 flex items-center justify-center overflow-hidden z-10 -mb-4 shadow-[0_0_10px_rgba(148,163,184,0.3)]">
                 <img v-if="ranking[1].avatar_url" :src="ranking[1].avatar_url" class="w-full h-full object-cover" />
                 <span v-else class="text-xl font-bold text-slate-400">{{ ranking[1].nome?.charAt(0).toUpperCase() }}</span>
               </div>
               <div class="bg-gradient-to-t from-slate-800 to-copa-silver/20 border border-slate-700 border-b-0 w-full rounded-tl-xl pt-6 pb-2 text-center shadow-lg">
                 <div class="text-xs font-bold text-white truncate px-1">{{ ranking[1].nome.split(' ')[0] }}</div>
                 <div class="text-sm font-black text-copa-silver">{{ ranking[1].pontos }}</div>
               </div>
            </div>
            
            <!-- Primeiro Lugar (1) -->
            <div class="flex flex-col items-center justify-end w-[40%] z-10">
               <div class="relative">
                 <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl z-20 drop-shadow-md">👑</div>
                 <div class="w-20 h-20 rounded-full border-4 border-copa-gold bg-slate-800 flex items-center justify-center overflow-hidden z-10 -mb-6 shadow-[0_0_15px_rgba(250,204,21,0.5)]">
                   <img v-if="ranking[0].avatar_url" :src="ranking[0].avatar_url" class="w-full h-full object-cover" />
                   <span v-else class="text-2xl font-bold text-slate-400">{{ ranking[0].nome?.charAt(0).toUpperCase() }}</span>
                 </div>
               </div>
               <div class="bg-gradient-to-t from-slate-800 to-copa-gold/30 border border-slate-700 border-b-0 w-full h-28 rounded-t-xl pt-8 pb-2 text-center shadow-lg">
                 <div class="text-sm font-bold text-white truncate px-1">{{ ranking[0].nome.split(' ')[0] }}</div>
                 <div class="text-lg font-black text-copa-gold">{{ ranking[0].pontos }}</div>
               </div>
            </div>
            
            <!-- Terceiro Lugar (3) -->
            <div class="flex flex-col items-center justify-end w-[30%]">
               <div class="relative w-12 h-12 rounded-full border-2 border-copa-bronze bg-slate-800 flex items-center justify-center overflow-hidden z-10 -mb-3 shadow-[0_0_10px_rgba(217,119,6,0.3)]">
                 <img v-if="ranking[2].avatar_url" :src="ranking[2].avatar_url" class="w-full h-full object-cover" />
                 <span v-else class="text-lg font-bold text-slate-400">{{ ranking[2].nome?.charAt(0).toUpperCase() }}</span>
               </div>
               <div class="bg-gradient-to-t from-slate-800 to-copa-bronze/20 border border-slate-700 border-b-0 w-full h-16 rounded-tr-xl pt-4 pb-2 text-center shadow-lg">
                 <div class="text-xs font-bold text-white truncate px-1">{{ ranking[2].nome.split(' ')[0] }}</div>
                 <div class="text-sm font-black text-copa-bronze">{{ ranking[2].pontos }}</div>
               </div>
            </div>
          </div>
        </div>
        
        <!-- Empty state for podium -->
        <div v-else-if="!loading" class="text-center py-6">
           <p class="text-slate-400 font-medium">Aguardando mais jogadores para o pódio</p>
        </div>

        <!-- Highlights Section -->
        <div class="flex flex-col gap-2">
        <!-- Rei da Rodada -->
        <div v-if="reiDaRodada" class="relative overflow-hidden rounded-xl bg-gradient-to-br from-copa-accent to-copa-accent-dark p-[1px]">
          <div class="absolute top-0 right-0 p-2 opacity-20">
            <PhCrownSimple :size="48" />
          </div>
          <div class="bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-copa-gold to-yellow-200 p-[1px] shadow-sm shadow-copa-gold/20">
                <img v-if="reiDaRodada.avatar_url" :src="reiDaRodada.avatar_url" class="w-full h-full object-cover rounded-full border border-slate-900" />
                <div v-else class="w-full h-full bg-slate-800 rounded-full flex items-center justify-center border border-slate-900">
                  <span class="text-sm font-black text-white">
                    {{ reiDaRodada.nome?.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-[10px] font-bold text-copa-gold uppercase tracking-wider flex items-center gap-1">
                    <PhCrownSimple :size="12" /> Rei da Rodada
                  </h2>
                  <span class="text-[8px] text-slate-400 font-medium bg-white/5 px-1.5 py-0.5 rounded">{{ highlightsDateFormatted }}</span>
                </div>
                <div class="text-sm font-black text-white leading-tight truncate mt-0.5">
                  {{ reiDaRodada.nome }}
                  <span v-if="isCurrentUser(reiDaRodada)" class="text-[10px] text-copa-gold font-bold ml-1">(Você)</span>
                </div>
                <div class="text-[10px] text-slate-300 mt-0.5">
                  <span class="font-bold text-white">{{ reiDaRodada.pontos }} pts</span> no dia
                </div>
              </div>

              <!-- Export Button -->
              <button 
                v-if="isCurrentUser(reiDaRodada)"
                @click="exportStory"
                :disabled="exporting"
                class="shrink-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 transition-opacity text-white p-2 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/25"
                title="Postar Vitória"
              >
                <svg v-if="exporting" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Bobo da Rodada -->
        <div v-if="boboDaRodada" class="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-900 p-[1px]">
          <div class="absolute top-0 right-0 p-2 opacity-20">
            <PhBone :size="48" />
          </div>
          <div class="bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-orange-400 p-[1px] shadow-sm shadow-red-500/20">
                <img v-if="boboDaRodada.avatar_url" :src="boboDaRodada.avatar_url" class="w-full h-full object-cover rounded-full border border-slate-900" />
                <div v-else class="w-full h-full bg-slate-800 rounded-full flex items-center justify-center border border-slate-900">
                  <span class="text-sm font-black text-white">
                    {{ boboDaRodada.nome?.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <PhBone :size="12" /> Bobo da Rodada
                  </h2>
                  <span class="text-[8px] text-slate-400 font-medium bg-white/5 px-1.5 py-0.5 rounded">{{ highlightsDateFormatted }}</span>
                </div>
                <div class="text-sm font-black text-white leading-tight truncate mt-0.5">
                  {{ boboDaRodada.nome }}
                  <span v-if="isCurrentUser(boboDaRodada)" class="text-[10px] text-red-400 font-bold ml-1">(Você)</span>
                </div>
                <div class="text-[10px] text-slate-300 mt-0.5">
                  <span class="font-bold text-red-400">{{ boboDaRodada.pontos }} pts</span> no dia
                </div>
              </div>

              <!-- Export Button -->
              <button 
                v-if="isCurrentUser(boboDaRodada)"
                @click="exportBoboStory"
                :disabled="exportingBobo"
                class="shrink-0 bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:opacity-90 transition-opacity text-white p-2 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/25"
                title="Postar (Tristeza)"
              >
                <svg v-if="exportingBobo" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- On Fire -->
        <div v-if="onFirePlayer" class="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 p-[1px]">
          <div class="absolute top-0 right-0 p-2 opacity-20">
            <PhFire :size="48" />
          </div>
          <div class="bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 relative z-10">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-400 to-yellow-500 p-[1px] shadow-sm shadow-orange-500/20">
                <img v-if="onFirePlayer.avatar_url" :src="onFirePlayer.avatar_url" class="w-full h-full object-cover rounded-full border border-slate-900" />
                <div v-else class="w-full h-full bg-slate-800 rounded-full flex items-center justify-center border border-slate-900">
                  <span class="text-sm font-black text-white">
                    {{ onFirePlayer.nome?.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
                    <PhFire :size="12" /> On Fire
                  </h2>
                  <span class="text-[8px] text-slate-400 font-medium bg-white/5 px-1.5 py-0.5 rounded">Agora</span>
                </div>
                <div class="text-sm font-black text-white leading-tight truncate mt-0.5">
                  {{ onFirePlayer.nome }}
                  <span v-if="isCurrentUser(onFirePlayer)" class="text-[10px] text-orange-400 font-bold ml-1">(Você)</span>
                </div>
                <div class="text-[10px] text-slate-300 mt-0.5">
                  <span class="font-bold text-orange-400">{{ onFirePlayer.acertos_seguidos }} acertos</span> seguidos
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <!-- GERAL E DIÁRIO VIEWS -->
      <div v-else-if="activeTab === 'geral' || activeTab === 'diario'" class="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
        <div class="flex items-center justify-between mb-3 px-1 mt-2">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {{ activeTab === 'geral' ? 'Ranking Geral' : 'Ranking Diário' }}
          </h3>
          
          <div v-if="activeTab === 'diario'" class="relative">
            <input 
              type="date" 
              v-model="selectedDate" 
              class="bg-slate-800 text-xs text-white border border-slate-700 rounded-md px-2 py-1 focus:outline-none focus:border-copa-accent"
            />
          </div>
        </div>

      <!-- Podium (top 3) -->
      <div
        v-for="(player, index) in displayedRanking"
        :key="player.usuario_id"
        class="animate-slide-up"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <div
          class="glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200"
          :class="{
            'ring-1 ring-copa-gold/40 bg-copa-gold/5': player.posicao === 1,
            'ring-1 ring-copa-silver/30 bg-copa-silver/5': player.posicao === 2,
            'ring-1 ring-copa-bronze/30 bg-copa-bronze/5': player.posicao === 3,
            'ring-1 ring-copa-accent/20 bg-copa-accent/5': isCurrentUser(player),
          }"
        >
          <!-- Position -->
          <div class="shrink-0 w-10 flex flex-col items-center justify-center">
            <span v-if="player.posicao === 1" class="text-2xl">🥇</span>
            <span v-else-if="player.posicao === 2" class="text-2xl">🥈</span>
            <span v-else-if="player.posicao === 3" class="text-2xl">🥉</span>
            <span v-else class="text-lg font-bold text-slate-500">{{ player.posicao }}º</span>
            
            <!-- Position Change Indicator -->
            <div v-if="activeTab === 'geral' && player.mudanca_posicao !== undefined" class="flex items-center text-[10px] font-bold mt-0.5" title="Mudança de posição em relação aos jogos anteriores">
              <template v-if="player.mudanca_posicao > 0">
                <PhCaretUp weight="bold" class="text-green-500" />
                <span class="text-green-500">{{ player.mudanca_posicao }}</span>
              </template>
              <template v-else-if="player.mudanca_posicao < 0">
                <PhCaretDown weight="bold" class="text-red-500" />
                <span class="text-red-500">{{ Math.abs(player.mudanca_posicao) }}</span>
              </template>
              <template v-else>
                <PhMinus weight="bold" class="text-slate-500" />
              </template>
            </div>
          </div>

          <!-- Name + stats -->
          <div class="flex-1 min-w-0 flex items-center gap-2">
            <!-- Avatar -->
            <div class="w-8 h-8 rounded-full bg-slate-800 shrink-0 border border-slate-700 overflow-hidden flex items-center justify-center"
                 :class="{
                   'border-copa-gold ring-1 ring-copa-gold/50': player.posicao === 1,
                   'border-copa-silver ring-1 ring-copa-silver/50': player.posicao === 2,
                   'border-copa-bronze ring-1 ring-copa-bronze/50': player.posicao === 3,
                 }">
              <img v-if="player.avatar_url" :src="player.avatar_url" class="w-full h-full object-cover" />
              <span v-else class="text-xs font-bold text-slate-400">{{ player.nome?.charAt(0).toUpperCase() }}</span>
            </div>
            
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span
                  class="font-bold text-sm truncate"
                  :class="isCurrentUser(player) ? 'text-copa-accent-light' : 'text-white'"
                >
                  {{ player.nome }}
                </span>
                <span v-if="isCurrentUser(player)" class="text-[10px] text-copa-accent font-semibold">(você)</span>
              </div>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] text-slate-500">
                {{ player.jogos_computados || 0 }} jogos
              </span>
              <div class="flex items-center gap-1.5">
                <span v-if="player.acertos_exatos > 0" class="text-[10px] text-copa-gold">
                  🎯 {{ player.acertos_exatos }}
                </span>
                <span v-if="player.acertos_seguidos > 1" class="text-[10px] text-orange-500 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  🔥 {{ player.acertos_seguidos }}
                </span>
            </div>
          </div>
          </div>
          </div>

          <!-- Points -->
          <div class="shrink-0 text-right">
            <div
              class="text-xl font-black"
              :class="{
                'text-copa-gold': player.posicao === 1,
                'text-copa-silver': player.posicao === 2,
                'text-copa-bronze': player.posicao === 3,
                'text-white': player.posicao > 3,
              }"
            >
              {{ player.pontos }}
            </div>
            <div class="text-[10px] text-slate-500 font-semibold">pts</div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="displayedRanking.length === 0 && !isDisplayedLoading" class="text-center py-16">
        <div class="text-4xl mb-3">🏟️</div>
        <p class="text-slate-400 font-medium">Nenhum resultado ainda</p>
        <p class="text-slate-500 text-sm mt-1">O ranking será atualizado quando os jogos forem finalizados.</p>
      </div>

      <!-- Scoring legend -->
      <div class="mt-4 mb-4">
        <div class="glass rounded-xl p-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pontuação</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-300">🎯 Placar exato</span>
              <span class="font-bold text-copa-gold">5 pts</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-300">✅ Acertou vencedor/empate</span>
              <span class="font-bold text-copa-green">3 pts</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-300">❌ Errou</span>
              <span class="font-bold text-red-400">0 pts</span>
            </div>
          </div>
        </div>
      </div>
      </div> <!-- End of Scrollable Area -->
    </div>

    <ReiDaRodadaCard 
      v-if="reiDaRodada" 
      ref="cardComponent"
      :player="reiDaRodada" 
      :date="selectedDate" 
    />
    <BoboDaRodadaCard 
      v-if="boboDaRodada" 
      ref="boboCardComponent"
      :player="boboDaRodada" 
      :date="selectedDate" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRanking } from '@/composables/useRanking'
import { useRankingDiario } from '@/composables/useRankingDiario'
import { useAuth } from '@/composables/useAuth'
import { toPng } from 'html-to-image'
import ReiDaRodadaCard from '@/components/ReiDaRodadaCard.vue'
import BoboDaRodadaCard from '@/components/BoboDaRodadaCard.vue'
import { PhTrophy, PhCrownSimple, PhBone, PhFire, PhCaretUp, PhCaretDown, PhMinus } from '@phosphor-icons/vue'


const { ranking, loading } = useRanking()
const { user } = useAuth()

const activeTab = ref('tops')

// Usa a data de hoje no formato YYYY-MM-DD
const hoje = new Date()
const selectedDate = ref(hoje.toISOString().split('T')[0])
const { ranking: rankingDiario, loading: loadingDiario } = useRankingDiario(selectedDate)

// Busca ranking de ontem como fallback para os destaques caso não tenha jogos hoje
const ontem = new Date()
ontem.setDate(ontem.getDate() - 1)
const dataOntem = ref(ontem.toISOString().split('T')[0])
const { ranking: rankingOntem } = useRankingDiario(dataOntem)

const highlightsRanking = computed(() => {
  return rankingDiario.value && rankingDiario.value.length > 0 ? rankingDiario.value : rankingOntem.value
})

const displayedRanking = computed(() => activeTab.value === 'geral' ? ranking.value : rankingDiario.value)
const isDisplayedLoading = computed(() => activeTab.value === 'geral' ? loading.value : loadingDiario.value)

const reiDaRodada = computed(() => {
  if (highlightsRanking.value && highlightsRanking.value.length > 0) {
    return highlightsRanking.value[0]
  }
  return null
})

const boboDaRodada = computed(() => {
  if (!highlightsRanking.value || highlightsRanking.value.length === 0) return null
  
  let bobo = null
  let minPontos = Infinity

  for (const player of highlightsRanking.value) {
    const jogosComputados = player.jogos_computados || 0
    
    // Ignora pessoas que não deram palpites
    if (jogosComputados === 0) continue

    const pontos = player.pontos || 0
    
    if (pontos < minPontos) {
      minPontos = pontos
      bobo = player
    } else if (pontos === minPontos && bobo) {
      // Desempate: quem errou mais (maior proporção de erros, etc)
      // Como simplificação, se tiverem os mesmos pontos, escolhemos quem tem mais erros
      const erros = jogosComputados - (player.acertos_vencedor || 0)
      const boboErros = (bobo.jogos_computados || 0) - (bobo.acertos_vencedor || 0)
      
      if (erros > boboErros) {
        bobo = player
      }
    }
  }

  return bobo
})

const onFirePlayer = computed(() => {
  if (!ranking.value || ranking.value.length === 0) return null
  
  let onFire = null
  let maxStreak = 0

  for (const player of ranking.value) {
    if ((player.acertos_seguidos || 0) > maxStreak) {
      maxStreak = player.acertos_seguidos
      onFire = player
    } else if ((player.acertos_seguidos || 0) === maxStreak && maxStreak > 0) {
      if (onFire && player.pontos > onFire.pontos) {
        onFire = player
      }
    }
  }

  if (maxStreak > 1) return onFire
  return null
})

const highlightsDateFormatted = computed(() => {
  const dateStr = (rankingDiario.value && rankingDiario.value.length > 0) ? selectedDate.value : dataOntem.value
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}`
})

const selectedDateFormatted = computed(() => {
  const [y, m, d] = selectedDate.value.split('-')
  return `${d}/${m}`
})

function isCurrentUser(player) {
  return player.usuario_id === user.value?.id
}

const cardComponent = ref(null)
const exporting = ref(false)

const boboCardComponent = ref(null)
const exportingBobo = ref(false)

async function exportStory() {
  if (!cardComponent.value) return
  
  exporting.value = true
  try {
    const el = cardComponent.value.$el || cardComponent.value
    
    // Carrega dados de palpites para a imagem
    if (typeof cardComponent.value.loadData === 'function') {
      await cardComponent.value.loadData()
    }

    // Esperar a fonte carregar, a div estar no DOM e as imagens renderizarem
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const targetEl = cardComponent.value.cardRef || el.querySelector('.w-\\[1080px\\]') || el
    
    // Configurações para o html-to-image ser mais robusto
    const image = await toPng(targetEl, {
      pixelRatio: 2,
      backgroundColor: '#0f172a',
      cacheBust: true,
      skipAutoScale: true,
      // Tenta evitar problemas de fontes externas travando o processo
      filter: (node) => {
        // Ignora scripts ou elementos que possam causar problemas
        return node.tagName !== 'SCRIPT';
      }
    })
    
    // Tenta compartilhar nativamente
    if (navigator.share) {
      try {
        const blob = await (await fetch(image)).blob()
        const file = new File([blob], 'rei-da-rodada.png', { type: 'image/png' })
        
        await navigator.share({
          title: 'Eu sou o Rei da Rodada!',
          text: 'Olha quem mandou bem hoje no Bolão!',
          files: [file]
        })
        return
      } catch (e) {
        console.log('Share falhou, tentando fallback', e)
      }
    }
    
    // Fallback: Download da imagem
    const link = document.createElement('a')
    link.download = `rei-da-rodada-${selectedDate.value}.png`
    link.href = image
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (err) {
    console.error('Erro ao gerar imagem', err)
    alert('Não foi possível gerar a imagem. Tente novamente.')
  } finally {
    exporting.value = false
  }
}

async function exportBoboStory() {
  if (!boboCardComponent.value) return
  
  exportingBobo.value = true
  try {
    const el = boboCardComponent.value.$el || boboCardComponent.value
    
    if (typeof boboCardComponent.value.loadData === 'function') {
      await boboCardComponent.value.loadData()
    }

    await new Promise(resolve => setTimeout(resolve, 500))
    
    const targetEl = boboCardComponent.value.cardRef || el.querySelector('.w-\\[1080px\\]') || el
    
    const image = await toPng(targetEl, {
      pixelRatio: 2,
      backgroundColor: '#0f172a',
      cacheBust: true,
      skipAutoScale: true,
      filter: (node) => node.tagName !== 'SCRIPT'
    })
    
    if (navigator.share) {
      try {
        const blob = await (await fetch(image)).blob()
        const file = new File([blob], 'bobo-da-rodada.png', { type: 'image/png' })
        
        await navigator.share({
          title: 'Eu sou o Bobo da Rodada!',
          text: 'Não foi dessa vez...',
          files: [file]
        })
        return
      } catch (e) {
        console.log('Share falhou, tentando fallback', e)
      }
    }
    
    const link = document.createElement('a')
    link.download = `bobo-da-rodada-${selectedDate.value}.png`
    link.href = image
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
  } catch (err) {
    console.error('Erro ao gerar imagem', err)
    alert('Não foi possível gerar a imagem. Tente novamente.')
  } finally {
    exportingBobo.value = false
  }
}
</script>
