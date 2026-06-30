<template>
  <div class="pb-20 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="relative px-4 py-3 flex items-center">
        <button @click="$router.back()" class="p-2 rounded-lg text-white tap-scale relative z-10">
          &larr;
        </button>
        <h1 class="absolute inset-0 flex items-center justify-center font-bold text-white text-lg pointer-events-none">
          Estatísticas da Seleção
        </h1>
      </div>
    </header>

    <div class="p-4 space-y-6 max-w-2xl mx-auto">
      <!-- Select Team -->
      <div class="glass p-5 rounded-2xl shadow-xl flex flex-col gap-4 relative overflow-hidden">
        <div class="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <label class="text-sm font-semibold text-slate-300 relative z-10">Selecione uma Seleção:</label>
        <div class="relative z-10">
          <select 
            v-model="selectedTeam" 
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-copa-accent appearance-none cursor-pointer"
          >
            <option value="" disabled>Escolha...</option>
            <option v-for="team in selecoes" :key="team" :value="team" class="bg-slate-900">
              {{ team }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>

        <div v-if="selectedTeam" class="flex items-center gap-4 mt-2 justify-center">
          <img v-if="getFlagUrl(selectedTeam)" :src="getFlagUrl(selectedTeam)" class="w-16 h-12 object-cover rounded shadow-lg ring-2 ring-white/10" />
          <span class="font-bold text-2xl text-white">{{ selectedTeam }}</span>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-copa-accent" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>

      <template v-else-if="selectedTeam && selecaoStats">
        
        <!-- Top Averages -->
        <div class="glass p-4 sm:p-6 rounded-2xl shadow-xl space-y-6 relative overflow-hidden">
          <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h4 class="text-sm text-slate-300 font-bold text-center border-b border-white/5 pb-3 relative z-10 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" class="text-yellow-400">
              <path d="M239.2,97.29a16,16,0,0,0-13.81-11L166.42,81.41,141.6,29.17a16,16,0,0,0-27.2,0L89.58,81.41,30.61,86.3a16,16,0,0,0-8.81,28.06l45.41,39.46-13.62,56.55a16,16,0,0,0,23.84,17.34l50.57-30.82,50.57,30.82a16,16,0,0,0,23.84-17.34l-13.62-56.55,45.41-39.46A16,16,0,0,0,239.2,97.29Z"></path>
            </svg>
            Melhores Médias no Torneio
          </h4>

          <div v-if="selecaoStats.averages.length > 0" class="space-y-4 relative z-10">
            <div 
              v-for="(player, index) in selecaoStats.averages.slice(0, 10)" 
              :key="player.playerId" 
              class="flex items-center gap-4 bg-white/5 p-3 rounded-xl ring-1 ring-white/5"
            >
              <!-- Rank Number -->
              <div class="w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
                :class="{
                  'bg-yellow-400 text-yellow-900 shadow-[0_0_10px_rgba(250,204,21,0.5)]': index === 0,
                  'bg-slate-300 text-slate-800': index === 1,
                  'bg-amber-600 text-amber-50': index === 2,
                  'bg-slate-800 text-slate-400': index > 2
                }">
                {{ index + 1 }}
              </div>
              
              <!-- Player Photo -->
              <div 
                class="relative shrink-0 w-12 h-12 rounded-full overflow-hidden border-2"
                :class="index === 0 ? 'border-yellow-400' : 'border-slate-600'"
              >
                <img 
                  v-if="player.playerPicture" 
                  :src="player.playerPicture" 
                  class="w-full h-full object-cover object-top scale-220 origin-top transform"
                  alt="Player picture"
                />
                <div v-else class="w-full h-full bg-slate-800 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" class="text-slate-500">
                    <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
                  </svg>
                </div>
              </div>
              
              <!-- Player Info -->
              <div class="flex-1 min-w-0">
                <div class="truncate text-white font-bold text-sm">
                  {{ player.playerName }}
                </div>
                <div class="truncate text-slate-400 text-xs">
                  Jogos: {{ player.matchesPlayed }}
                </div>
                
                <!-- Skill bars (Averages) -->
                <div class="flex gap-2 mt-1.5">
                  <div class="flex-1" title="Ataque">
                    <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-red-500" :style="{ width: (player.avgAttacking * 10) + '%' }"></div>
                    </div>
                  </div>
                  <div class="flex-1" title="Criatividade">
                    <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-yellow-400" :style="{ width: (player.avgCreativity * 10) + '%' }"></div>
                    </div>
                  </div>
                  <div class="flex-1" title="Defesa">
                    <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div class="h-full bg-blue-500" :style="{ width: (player.avgDefensive * 10) + '%' }"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Overall Score -->
              <div class="shrink-0 flex flex-col items-center justify-center">
                <span class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-0.5">Média</span>
                <span class="text-base font-black text-white" :class="index === 0 ? 'text-yellow-400' : ''">
                  {{ player.avgScore.toFixed(1) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-slate-400 py-4 text-sm relative z-10">
            Nenhum dado disponível.
          </div>
        </div>

        <!-- Highlights per Match -->
        <div class="space-y-4">
          <h3 class="font-bold text-white text-lg pl-2">Destaques por Partida</h3>
          
          <div v-for="matchData in selecaoStats.matches" :key="matchData.jogo.id" class="glass p-4 rounded-2xl shadow-xl flex flex-col gap-4">
            
            <!-- Match Header -->
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <div class="flex items-center gap-2 w-1/3">
                <img v-if="getFlagUrl(matchData.jogo.mandante)" :src="getFlagUrl(matchData.jogo.mandante)" class="w-8 h-6 object-cover rounded shadow" />
                <span class="font-bold text-white text-xs sm:text-sm truncate">{{ matchData.jogo.mandante }}</span>
              </div>
              
              <div class="flex items-center gap-2">
                <span class="font-bold text-lg text-white">{{ matchData.resultado?.gols_mandante ?? '-' }}</span>
                <span class="text-slate-500 font-bold">×</span>
                <span class="font-bold text-lg text-white">{{ matchData.resultado?.gols_visitante ?? '-' }}</span>
              </div>
              
              <div class="flex items-center gap-2 w-1/3 justify-end">
                <span class="font-bold text-white text-xs sm:text-sm truncate text-right">{{ matchData.jogo.visitante }}</span>
                <img v-if="getFlagUrl(matchData.jogo.visitante)" :src="getFlagUrl(matchData.jogo.visitante)" class="w-8 h-6 object-cover rounded shadow" />
              </div>
            </div>

            <!-- Match Top 3 -->
            <div v-if="matchData.topPlayers.length > 0" class="flex flex-col gap-2">
              <div 
                v-for="(player, idx) in matchData.topPlayers" 
                :key="player.playerId"
                class="flex items-center gap-3 bg-white/5 p-2 rounded-lg"
              >
                <div class="w-5 h-5 shrink-0 flex items-center justify-center rounded-full text-[10px] font-bold"
                  :class="{
                    'bg-yellow-400 text-yellow-900': idx === 0,
                    'bg-slate-300 text-slate-800': idx === 1,
                    'bg-amber-600 text-amber-50': idx === 2
                  }">
                  {{ idx + 1 }}
                </div>
                
                <div class="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-slate-800">
                  <img 
                    v-if="player.playerPicture?.pictureUrl" 
                    :src="player.playerPicture.pictureUrl" 
                    class="w-full h-full object-cover object-top scale-220 origin-top transform"
                  />
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="truncate text-white text-xs font-bold">{{ player.playerName?.[0]?.description || 'Jogador' }}</div>
                </div>
                
                <div class="shrink-0 font-black text-sm" :class="idx === 0 ? 'text-yellow-400' : 'text-white'">
                  {{ player.totalScore.toFixed(1) }}
                </div>
              </div>
            </div>
            <div v-else class="text-center text-slate-400 text-xs py-2">
              Dados não disponíveis
            </div>
            
          </div>
        </div>
      </template>

      <div v-else-if="selectedTeam && !loading && selecaoStats?.matches?.length === 0" class="text-center text-slate-400 py-10">
        Nenhuma estatística encontrada para esta seleção.
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useJogos } from '@/composables/useJogos'
import { getTeamId } from '@/data/teamIds'
import { getFlagUrl } from '@/utils/flags'

const { jogosData } = useJogos()

const selecoes = computed(() => {
  const teams = new Set()
  jogosData.forEach(j => {
    teams.add(j.mandante)
    teams.add(j.visitante)
  })
  return Array.from(teams).sort()
})

const selectedTeam = ref('')
const selecaoStats = ref(null)
const loading = ref(false)

watch(selectedTeam, async (newTeam) => {
  if (!newTeam) {
    selecaoStats.value = null
    return
  }
  
  loading.value = true
  
  const matchIds = jogosData
    .filter(j => j.mandante === newTeam || j.visitante === newTeam)
    .map(j => j.id)
    
  if (matchIds.length === 0) {
    selecaoStats.value = { matches: [], averages: [] }
    loading.value = false
    return
  }
  
  const { data, error } = await supabase
    .from('resultados')
    .select('jogo_id, power_rankings, gols_mandante, gols_visitante')
    .in('jogo_id', matchIds)
    .not('power_rankings', 'is', null)
    
  if (error) {
    console.error("Error fetching selecao stats:", error)
    loading.value = false
    return
  }
  
  const matchesMap = {}
  data?.forEach(r => {
    matchesMap[r.jogo_id] = r
  })
  
  const targetTeamId = getTeamId(newTeam)
  
  const matchesData = []
  const playerStatsMap = {}
  
  matchIds.forEach(id => {
    const jogo = jogosData.find(j => j.id === id)
    const result = matchesMap[id]
    if (!result || !result.power_rankings?.outfieldPlayers) return
    
    // Filter players by teamId (or fallback to name matching if teamId is not available/mapped)
    const teamPlayers = result.power_rankings.outfieldPlayers.filter(p => {
       if (targetTeamId && p.teamId) {
         return p.teamId.toString() === targetTeamId.toString()
       }
       // Fallback: Check if localized name is close, or if the match team string is exact
       const pTeamName = p.teamName?.[0]?.description || ''
       return pTeamName === newTeam
    })
    
    if (teamPlayers.length === 0) return;

    const playersWithScore = teamPlayers.map(p => ({
      ...p,
      totalScore: (p.attackingScore || 0) + (p.defensiveScore || 0) + (p.creativityScore || 0)
    })).sort((a,b) => b.totalScore - a.totalScore)
    
    playersWithScore.forEach(p => {
       if (!playerStatsMap[p.playerId]) {
          playerStatsMap[p.playerId] = {
             playerId: p.playerId,
             playerName: p.playerName?.[0]?.description || 'Jogador',
             playerPicture: p.playerPicture?.pictureUrl,
             totalScores: [],
             attackingScores: [],
             creativityScores: [],
             defensiveScores: []
          }
       }
       playerStatsMap[p.playerId].totalScores.push(p.totalScore)
       playerStatsMap[p.playerId].attackingScores.push(p.attackingScore || 0)
       playerStatsMap[p.playerId].creativityScores.push(p.creativityScore || 0)
       playerStatsMap[p.playerId].defensiveScores.push(p.defensiveScore || 0)
    })
    
    matchesData.push({
      jogo,
      resultado: { gols_mandante: result.gols_mandante, gols_visitante: result.gols_visitante },
      topPlayers: playersWithScore.slice(0, 3)
    })
  })
  
  // Averages
  const averages = Object.values(playerStatsMap).map(p => ({
    ...p,
    avgScore: p.totalScores.reduce((a,b) => a + b, 0) / p.totalScores.length,
    avgAttacking: p.attackingScores.reduce((a,b) => a + b, 0) / p.attackingScores.length,
    avgCreativity: p.creativityScores.reduce((a,b) => a + b, 0) / p.creativityScores.length,
    avgDefensive: p.defensiveScores.reduce((a,b) => a + b, 0) / p.defensiveScores.length,
    matchesPlayed: p.totalScores.length
  })).sort((a,b) => b.avgScore - a.avgScore)
  
  selecaoStats.value = {
    matches: matchesData,
    averages: averages
  }
  
  loading.value = false
})

onMounted(() => {
  // Initialize anything if needed
})
</script>
