<template>
  <div class="glass p-4 sm:p-6 rounded-2xl shadow-xl space-y-6 mt-4 relative overflow-hidden">
    <!-- Background Glow -->
    <div class="absolute -top-24 -left-24 w-48 h-48 bg-copa-accent/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

    <h4 class="text-sm text-slate-300 font-bold text-center border-b border-white/5 pb-3 relative z-10">
      Estatísticas da Partida
    </h4>
    
    <div v-if="processedStats.length > 0" class="space-y-6 relative z-10">
      <div v-for="stat in processedStats" :key="stat.key" class="space-y-2 group">
        <div class="flex justify-between text-xs font-semibold text-slate-300">
          <span class="w-12 text-center text-white text-sm transition-transform group-hover:scale-110">{{ stat.homeFormatted }}</span>
          <span class="uppercase tracking-widest text-[10px] sm:text-xs text-slate-400 opacity-80">{{ stat.label }}</span>
          <span class="w-12 text-center text-white text-sm transition-transform group-hover:scale-110">{{ stat.awayFormatted }}</span>
        </div>
        
        <div class="flex items-center justify-center gap-2">
          <!-- Home bar -->
          <div class="flex-1 h-2 sm:h-2.5 bg-slate-800/80 rounded-l-full overflow-hidden flex justify-end shadow-inner">
            <div 
              class="h-full bg-gradient-to-l from-copa-accent to-emerald-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              :style="{ width: stat.homePercent + '%' }"
            ></div>
          </div>
          
          <!-- Separator -->
          <div class="w-1 h-2 sm:h-2.5 bg-slate-600 rounded-full"></div>
          
          <!-- Away bar -->
          <div class="flex-1 h-2 sm:h-2.5 bg-slate-800/80 rounded-r-full overflow-hidden flex justify-start shadow-inner">
            <div 
              class="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              :style="{ width: stat.awayPercent + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center text-slate-400 py-4 text-sm relative z-10">
      Estatísticas não disponíveis
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  teamStats: Object,
  powerRankings: Object
})

const STATS_TO_SHOW = [
  { key: 'Possession', label: 'Posse de Bola', format: (val) => `${Math.round(val * 100)}%` },
  { key: 'XG', label: 'Gols Esperados (xG)', format: (val) => Number(val).toFixed(2) },
  { key: 'AttemptAtGoal', label: 'Finalizações', format: (val) => Math.round(val) },
  { key: 'AttemptAtGoalOnTarget', label: 'No Alvo', format: (val) => Math.round(val) },
  { key: 'Passes', label: 'Passes', format: (val) => Math.round(val) },
  { key: 'FoulsFor', label: 'Faltas', format: (val) => Math.round(val) },
  { key: 'Corners', label: 'Escanteios', format: (val) => Math.round(val) },
  { key: 'YellowCards', label: 'Cartões Amarelos', format: (val) => Math.round(val) }
]

const processedStats = computed(() => {
  if (!props.teamStats || !props.powerRankings?.outfieldPlayers?.length) return []
  
  let homeId, awayId;
  
  if (props.teamStats?.home_team_id && props.teamStats?.away_team_id) {
    homeId = props.teamStats.home_team_id;
    awayId = props.teamStats.away_team_id;
  } else {
    const teamIds = [...new Set(props.powerRankings.outfieldPlayers.map(p => p.teamId))]
    if (teamIds.length < 2) return []
    homeId = teamIds[0]
    awayId = teamIds[1]
  }
  
  const homeStatsData = props.teamStats[homeId] || []
  const awayStatsData = props.teamStats[awayId] || []
  
  const homeStatsMap = Object.fromEntries(homeStatsData.map(s => [s[0], s[1]]))
  const awayStatsMap = Object.fromEntries(awayStatsData.map(s => [s[0], s[1]]))
  
  return STATS_TO_SHOW.map(statConfig => {
    const homeVal = homeStatsMap[statConfig.key] || 0
    const awayVal = awayStatsMap[statConfig.key] || 0
    
    const total = homeVal + awayVal
    const homePercent = total > 0 ? (homeVal / total) * 100 : 50
    const awayPercent = total > 0 ? (awayVal / total) * 100 : 50
    
    return {
      key: statConfig.key,
      label: statConfig.label,
      homeValue: homeVal,
      awayValue: awayVal,
      homeFormatted: statConfig.format(homeVal),
      awayFormatted: statConfig.format(awayVal),
      homePercent,
      awayPercent
    }
  }).filter(stat => stat.homeValue > 0 || stat.awayValue > 0)
})
</script>
