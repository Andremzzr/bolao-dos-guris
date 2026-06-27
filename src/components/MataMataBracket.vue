<template>
  <div class="bracket-container overflow-auto relative hide-scrollbar w-full" style="max-height: calc(100vh - 130px);">
    <div class="flex items-stretch min-w-max p-4 gap-6">
      
      <!-- Rounds Loop -->
      <div v-for="(round, index) in rounds" :key="index" class="flex flex-col gap-2 min-w-[240px]">
        <div class="sticky top-0 bg-copa-bg py-3 z-20 mb-2 border-b border-copa-border shadow-sm">
          <h3 class="text-center font-bold text-copa-gold text-sm tracking-wider uppercase">{{ round.name }}</h3>
        </div>
        
        <!-- Column content with justify-around creates the bracket shape -->
        <div class="flex-1 flex flex-col justify-around">
          <div v-for="jogo in round.matches" :key="jogo.id" class="relative group my-2">
            
            <div 
              class="glass border border-copa-border rounded-xl p-3 shadow-lg w-full cursor-pointer hover:border-copa-accent hover:bg-copa-surface-light transition-all duration-200"
              @click="goToEstatisticas(jogo.id)"
            >
              <div class="text-[10px] text-slate-400 mb-2 flex justify-between items-center">
                <span class="font-mono bg-black/20 px-1.5 py-0.5 rounded">J{{ jogo.id }}</span>
                <span>{{ formatDate(jogo.data) }}</span>
              </div>
              
              <div class="flex flex-col gap-2">
                <!-- Mandante -->
                <div class="flex items-center gap-2">
                  <img v-if="getFlagUrl(jogo.mandante)" :src="getFlagUrl(jogo.mandante)" class="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                  <div v-else class="w-5 h-3.5 rounded-[2px] bg-slate-700/50 flex-shrink-0"></div>
                  <span class="text-xs font-semibold text-white truncate flex-1" :class="{'text-slate-400/80': isPlaceholder(jogo.mandante)}">{{ formatName(jogo.mandante) }}</span>
                  <span v-if="resultados[jogo.id]?.finalizado" class="text-xs font-bold w-5 text-center bg-black/20 rounded py-0.5">{{ resultados[jogo.id].gols_mandante }}</span>
                </div>
                
                <!-- Visitante -->
                <div class="flex items-center gap-2">
                  <img v-if="getFlagUrl(jogo.visitante)" :src="getFlagUrl(jogo.visitante)" class="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                  <div v-else class="w-5 h-3.5 rounded-[2px] bg-slate-700/50 flex-shrink-0"></div>
                  <span class="text-xs font-semibold text-white truncate flex-1" :class="{'text-slate-400/80': isPlaceholder(jogo.visitante)}">{{ formatName(jogo.visitante) }}</span>
                  <span v-if="resultados[jogo.id]?.finalizado" class="text-xs font-bold w-5 text-center bg-black/20 rounded py-0.5">{{ resultados[jogo.id].gols_visitante }}</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
    </div>

    <!-- 3º Lugar section -->
    <div class="mt-8 px-4 max-w-sm mx-auto pb-8">
      <div class="flex items-center gap-2 mb-3 px-1 justify-center">
        <h2 class="text-sm font-bold text-slate-300 uppercase tracking-wider">Disputa de 3º Lugar</h2>
      </div>
      <div v-for="jogo in getMatches(thirdPlaceIds)" :key="jogo.id">
         <div 
            class="glass border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 shadow-lg w-full cursor-pointer hover:border-amber-500 transition-all duration-200"
            @click="goToEstatisticas(jogo.id)"
          >
            <div class="text-[10px] text-slate-400 mb-2 flex justify-between items-center">
              <span class="font-mono bg-black/20 px-1.5 py-0.5 rounded text-amber-500/80">J{{ jogo.id }}</span>
              <span>{{ formatDate(jogo.data) }}</span>
            </div>
            
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <img v-if="getFlagUrl(jogo.mandante)" :src="getFlagUrl(jogo.mandante)" class="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                <div v-else class="w-5 h-3.5 rounded-[2px] bg-slate-700/50 flex-shrink-0"></div>
                <span class="text-xs font-semibold text-white truncate flex-1" :class="{'text-slate-400/80': isPlaceholder(jogo.mandante)}">{{ formatName(jogo.mandante) }}</span>
                <span v-if="resultados[jogo.id]?.finalizado" class="text-xs font-bold w-5 text-center bg-black/20 rounded py-0.5 text-amber-400">{{ resultados[jogo.id].gols_mandante }}</span>
              </div>
              <div class="flex items-center gap-2">
                <img v-if="getFlagUrl(jogo.visitante)" :src="getFlagUrl(jogo.visitante)" class="w-5 h-3.5 object-cover rounded-[2px] shadow-sm" />
                <div v-else class="w-5 h-3.5 rounded-[2px] bg-slate-700/50 flex-shrink-0"></div>
                <span class="text-xs font-semibold text-white truncate flex-1" :class="{'text-slate-400/80': isPlaceholder(jogo.visitante)}">{{ formatName(jogo.visitante) }}</span>
                <span v-if="resultados[jogo.id]?.finalizado" class="text-xs font-bold w-5 text-center bg-black/20 rounded py-0.5 text-amber-400">{{ resultados[jogo.id].gols_visitante }}</span>
              </div>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useJogos } from '@/composables/useJogos'
import { getFlagUrl } from '@/utils/flags'

const router = useRouter()
const { jogosData, resultados } = useJogos()

// Bracket logic mapped exactly from the FIFA paths
const leftR32Ids = [74, 77, 73, 75, 83, 84, 81, 82]
const leftR16Ids = [89, 90, 93, 94]
const leftQFIds = [97, 98]
const leftSFIds = [101]

const rightR32Ids = [76, 78, 79, 80, 86, 88, 85, 87]
const rightR16Ids = [91, 92, 95, 96]
const rightQFIds = [99, 100]
const rightSFIds = [102]

const finalIds = [104]
const thirdPlaceIds = [103]

const getMatches = (ids) => ids.map(id => jogosData.find(j => j.id === id)).filter(Boolean)

const rounds = computed(() => [
  {
    name: '16-Avos',
    matches: [
      ...getMatches(leftR32Ids),
      ...getMatches(rightR32Ids)
    ]
  },
  {
    name: 'Oitavas',
    matches: [
      ...getMatches(leftR16Ids),
      ...getMatches(rightR16Ids)
    ]
  },
  {
    name: 'Quartas',
    matches: [
      ...getMatches(leftQFIds),
      ...getMatches(rightQFIds)
    ]
  },
  {
    name: 'Semifinal',
    matches: [
      ...getMatches(leftSFIds),
      ...getMatches(rightSFIds)
    ]
  },
  {
    name: 'Final',
    matches: getMatches(finalIds)
  }
])

function isPlaceholder(name) {
  if (!name) return true
  return name.includes('Venc.') || name.includes('Perd.') || name.includes('º Grupo') || name.match(/^[1-2][A-L]$/)
}

function formatName(name) {
  if (!name) return 'A Definir'
  // Simplify placeholders slightly for better fit if needed, but keeping it mostly as is for accuracy.
  return name
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function goToEstatisticas(id) {
  router.push(`/jogo/${id}`)
}
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
