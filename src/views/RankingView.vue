<template>
  <div class="h-[100dvh] pb-20 flex flex-col">
    <!-- Header -->
    <header class="shrink-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3">
        <h1 class="text-lg font-bold text-white">🏆 Classificação</h1>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-copa-accent" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Ranking list -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <!-- Rei da Rodada Section -->
      <div class="shrink-0 px-3 pt-3">
        <div v-if="reiDaRodada" class="mb-4">
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-copa-accent to-copa-accent-dark p-1">
          <div class="absolute top-0 right-0 p-4 opacity-20">
            <span class="text-6xl">👑</span>
          </div>
          <div class="bg-slate-900/90 backdrop-blur-sm rounded-xl p-5 relative z-10">
            <div class="flex justify-between items-start mb-2">
              <h2 class="text-sm font-bold text-copa-gold flex items-center gap-2 uppercase tracking-wider">
                <span>👑</span> Rei da Rodada
              </h2>
              <span class="text-xs text-slate-400 font-medium bg-white/5 px-2 py-1 rounded-md">{{ selectedDateFormatted }}</span>
            </div>
            
            <div class="flex items-center gap-4 mt-4">
              <div class="w-14 h-14 rounded-full bg-gradient-to-tr from-copa-gold to-yellow-200 p-0.5 shadow-lg shadow-copa-gold/20">
                <div class="w-full h-full bg-slate-800 rounded-full flex items-center justify-center border-2 border-slate-900">
                  <span class="text-xl font-black text-white">
                    {{ reiDaRodada.nome?.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </div>
              
              <div class="flex-1">
                <div class="text-lg font-black text-white leading-tight">
                  {{ reiDaRodada.nome }}
                  <span v-if="isCurrentUser(reiDaRodada)" class="text-xs text-copa-gold font-bold ml-1">(Você)</span>
                </div>
                <div class="text-sm text-slate-300 mt-0.5">
                  <span class="font-bold text-white">{{ reiDaRodada.pontos }} pts</span> no dia
                </div>
              </div>
            </div>

            <!-- Export Button -->
            <button 
            v-if="isCurrentUser(reiDaRodada)"
              @click="exportStory"
              :disabled="exporting"
              class="w-full mt-5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:opacity-90 transition-opacity text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/25"
            >
              <svg v-if="exporting" class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <template v-else>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Postar Vitória
              </template>
            </button>
          </div>
        </div>
      </div>
      </div>

      <!-- Scrollable Area -->
      <div class="flex-1 overflow-y-auto px-3 pb-6 space-y-2">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1 mt-2">Ranking Geral</h3>

      <!-- Podium (top 3) -->
      <div
        v-for="(player, index) in ranking"
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
          <div class="shrink-0 w-8 text-center">
            <span v-if="player.posicao === 1" class="text-2xl">🥇</span>
            <span v-else-if="player.posicao === 2" class="text-2xl">🥈</span>
            <span v-else-if="player.posicao === 3" class="text-2xl">🥉</span>
            <span v-else class="text-lg font-bold text-slate-500">{{ player.posicao }}º</span>
          </div>

          <!-- Name + stats -->
          <div class="flex-1 min-w-0">
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
              <span v-if="player.acertos_exatos > 0" class="text-[10px] text-copa-gold">
                🎯 {{ player.acertos_exatos }}
              </span>
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
      <div v-if="ranking.length === 0 && !loading" class="text-center py-16">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRanking } from '@/composables/useRanking'
import { useRankingDiario } from '@/composables/useRankingDiario'
import { useAuth } from '@/composables/useAuth'
import { toPng } from 'html-to-image'
import ReiDaRodadaCard from '@/components/ReiDaRodadaCard.vue'

const { ranking, loading } = useRanking()
const { user } = useAuth()

// Usa a data de ontem no formato YYYY-MM-DD
const ontem = new Date()
ontem.setDate(ontem.getDate() - 1)
const selectedDate = ref(ontem.toISOString().split('T')[0])
const { ranking: rankingDiario, loading: loadingDiario } = useRankingDiario(selectedDate.value)

const reiDaRodada = computed(() => {
  if (rankingDiario.value && rankingDiario.value.length > 0) {
    return rankingDiario.value[0]
  }
  return null
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
</script>
