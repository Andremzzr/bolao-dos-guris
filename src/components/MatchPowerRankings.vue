<template>
  <div class="glass p-4 sm:p-6 rounded-2xl shadow-xl space-y-6 mt-4 relative overflow-hidden">
    <!-- Background Glow -->
    <div class="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

    <h4 class="text-sm text-slate-300 font-bold text-center border-b border-white/5 pb-3 relative z-10 flex items-center justify-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256" class="text-yellow-400">
        <path d="M239.2,97.29a16,16,0,0,0-13.81-11L166.42,81.41,141.6,29.17a16,16,0,0,0-27.2,0L89.58,81.41,30.61,86.3a16,16,0,0,0-8.81,28.06l45.41,39.46-13.62,56.55a16,16,0,0,0,23.84,17.34l50.57-30.82,50.57,30.82a16,16,0,0,0,23.84-17.34l-13.62-56.55,45.41-39.46A16,16,0,0,0,239.2,97.29Z"></path>
      </svg>
      Destaques da Partida
    </h4>
    
    <div v-if="topPlayers.length > 0" class="space-y-4 relative z-10">
      <div 
        v-for="(player, index) in topPlayers" 
        :key="player.playerId" 
        @click="selectedPlayer = player"
        class="cursor-pointer flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors ring-1 ring-white/5 hover:ring-white/10"
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
            v-if="player.playerPicture?.pictureUrl" 
            :src="player.playerPicture.pictureUrl" 
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
            {{ player.playerName?.[0]?.description || 'Jogador' }}
          </div>
          <div class="truncate text-slate-400 text-xs">
            {{ player.teamName?.[0]?.description || 'Seleção' }}
          </div>
          
          <!-- Skill bars -->
          <div class="flex gap-2 mt-1.5">
            <div class="flex-1" title="Ataque">
              <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-red-500" :style="{ width: (player.attackingScore * 10) + '%' }"></div>
              </div>
            </div>
            <div class="flex-1" title="Criatividade">
              <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-yellow-400" :style="{ width: (player.creativityScore * 10) + '%' }"></div>
              </div>
            </div>
            <div class="flex-1" title="Defesa">
              <div class="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500" :style="{ width: (player.defensiveScore * 10) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Overall Score -->
        <div class="shrink-0 flex flex-col items-center justify-center">
          <span class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mb-0.5">Score</span>
          <span class="text-base font-black text-white" :class="index === 0 ? 'text-yellow-400' : ''">
            {{ player.totalScore.toFixed(1) }}
          </span>
        </div>
      </div>
      
      <!-- Legend -->
      <div class="flex justify-center gap-4 mt-2 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span> Ataque</div>
        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-yellow-400"></span> Criação</div>
        <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Defesa</div>
      </div>
    </div>
    <div v-else class="text-center text-slate-400 py-4 text-sm relative z-10">
      Destaques não disponíveis
    </div>

    <!-- Modal do Jogador -->
    <teleport to="body">
      <div v-if="selectedPlayer" class="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" @click.self="selectedPlayer = null">
        <div class="glass w-full max-w-md mx-auto p-6 pb-8 sm:pb-6 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden animate-fade-in-up">
          <button @click="selectedPlayer = null" class="absolute top-4 right-4 text-slate-400 hover:text-white z-50 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            ✕
          </button>
          
          <div class="flex flex-col items-center gap-4 relative z-10 mt-2 sm:mt-0">
            <!-- Player Photo -->
            <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-xl bg-slate-800">
              <img 
                v-if="selectedPlayer.playerPicture?.pictureUrl" 
                :src="selectedPlayer.playerPicture.pictureUrl" 
                class="w-full h-full object-cover object-top scale-220 origin-top transform"
                alt="Player picture"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 256 256" class="text-slate-500">
                  <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
                </svg>
              </div>
            </div>
            
            <div class="text-center">
              <h3 class="text-xl font-bold text-white">{{ selectedPlayer.playerName?.[0]?.description || 'Jogador' }}</h3>
              <p class="text-sm text-slate-400">{{ selectedPlayer.teamName?.[0]?.description || 'Seleção' }}</p>
            </div>
            
            <div class="w-full grid grid-cols-3 gap-2 mt-2">
              <div class="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <div class="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Ataque</div>
                <div class="text-lg font-black text-red-400">{{ selectedPlayer.attackingScore?.toFixed(1) || '-' }}</div>
              </div>
              <div class="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <div class="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Criação</div>
                <div class="text-lg font-black text-yellow-400">{{ selectedPlayer.creativityScore?.toFixed(1) || '-' }}</div>
              </div>
              <div class="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                <div class="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Defesa</div>
                <div class="text-lg font-black text-blue-400">{{ selectedPlayer.defensiveScore?.toFixed(1) || '-' }}</div>
              </div>
            </div>

            <div class="w-full mt-2" v-if="playerSpecificStats.length > 0">
               <h4 class="text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-white/10 pb-2 mb-3">Estatísticas Específicas</h4>
               <div class="space-y-2">
                  <div v-for="stat in playerSpecificStats" :key="stat.label" class="flex justify-between items-center text-sm bg-white/5 px-3 py-2 rounded-lg">
                    <span class="text-slate-400">{{ stat.label }}</span>
                    <span class="text-white font-bold">{{ stat.value }}</span>
                  </div>
               </div>
            </div>

            <div class="w-full bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mt-2 flex items-center justify-between">
              <span class="text-yellow-400 font-bold uppercase text-xs tracking-wider">Score Total</span>
              <span class="text-yellow-400 font-black text-xl">{{ selectedPlayer.totalScore?.toFixed(1) || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  powerRankings: Object,
  playerStats: Object
})

const selectedPlayer = ref(null)

const playerSpecificStats = computed(() => {
  if (!selectedPlayer.value || !props.playerStats) return []
  
  const pId = selectedPlayer.value.playerId
  const tId = selectedPlayer.value.teamId
  
  let statsRaw = null;
  
  if (props.playerStats[pId]) {
    statsRaw = props.playerStats[pId]
  } else if (props.playerStats[tId] && props.playerStats[tId][pId]) {
    statsRaw = props.playerStats[tId][pId]
  } else {
    for (const key in props.playerStats) {
      if (Array.isArray(props.playerStats[key])) {
        const found = props.playerStats[key].find(p => p.playerId === pId || p.id === pId || p[0] === pId)
        if (found) {
           statsRaw = found.stats || found[1] || found;
           break;
        }
      } else if (typeof props.playerStats[key] === 'object') {
        if (props.playerStats[key][pId]) {
          statsRaw = props.playerStats[key][pId]
          break;
        }
      }
    }
  }

  if (!statsRaw) return [];

  const STATS_DICT = {
    'Passes': 'Passes',
    'PassesCompleted': 'Passes Completos',
    'Goals': 'Gols',
    'Assists': 'Assistências',
    'DistanceCovered': 'Distância Percorrida (m)',
    'TopSpeed': 'Velocidade Máx. (km/h)',
    'AttemptAtGoal': 'Finalizações',
    'AttemptAtGoalOnTarget': 'No Alvo',
    'FoulsFor': 'Faltas Sofridas',
    'FoulsAgainst': 'Faltas Cometidas',
    'YellowCards': 'Cartões Amarelos'
  }

  let parsed = []
  if (Array.isArray(statsRaw)) {
    if (statsRaw.length > 0 && Array.isArray(statsRaw[0])) {
      parsed = statsRaw.filter(s => STATS_DICT[s[0]]).map(s => ({
        label: STATS_DICT[s[0]],
        value: typeof s[1] === 'number' && s[1] > 100 ? Math.round(s[1]) : (Math.round(s[1] * 10) / 10)
      }))
    }
  } else if (typeof statsRaw === 'object') {
     for (const [key, val] of Object.entries(statsRaw)) {
        if (STATS_DICT[key]) {
           parsed.push({ 
             label: STATS_DICT[key], 
             value: typeof val === 'number' && val > 100 ? Math.round(val) : (Math.round(val * 10) / 10) 
           })
        }
     }
  }

  return parsed.slice(0, 6)
})

const topPlayers = computed(() => {
  if (!props.powerRankings?.outfieldPlayers) return []
  
  // Calculate total score for each player and sort
  const players = props.powerRankings.outfieldPlayers.map(p => ({
    ...p,
    totalScore: (p.attackingScore || 0) + (p.defensiveScore || 0) + (p.creativityScore || 0)
  }))
  
  return players
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5) // Top 5 players
})
</script>
