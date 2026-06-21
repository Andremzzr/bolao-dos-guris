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
        class="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors ring-1 ring-white/5 hover:ring-white/10"
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
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  powerRankings: Object,
  playerStats: Object
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
