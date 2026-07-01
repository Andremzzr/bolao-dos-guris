<template>
  <div class="relative w-full max-w-[400px] mx-auto aspect-[105/68] bg-[#1a4a2c] rounded border-2 border-white/20 overflow-hidden shadow-inner flex items-center justify-center">
    <!-- Pitch Pattern (Stripes) -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_10%,transparent_10%,transparent_20%,rgba(255,255,255,0.03)_20%,rgba(255,255,255,0.03)_30%,transparent_30%,transparent_40%,rgba(255,255,255,0.03)_40%,rgba(255,255,255,0.03)_50%,transparent_50%,transparent_60%,rgba(255,255,255,0.03)_60%,rgba(255,255,255,0.03)_70%,transparent_70%,transparent_80%,rgba(255,255,255,0.03)_80%,rgba(255,255,255,0.03)_90%,transparent_90%)]"></div>

    <!-- Lines -->
    <!-- Halfway Line -->
    <div class="absolute top-0 bottom-0 left-1/2 w-px bg-white/30 -translate-x-1/2"></div>
    <!-- Center Circle -->
    <div class="absolute top-1/2 left-1/2 w-[20%] pt-[20%] border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
    <div class="absolute top-1/2 left-1/2 w-1 h-1 bg-white/30 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
    
    <!-- Left Penalty Box -->
    <div class="absolute top-[20%] bottom-[20%] left-0 w-[16%] border border-white/30 border-l-0"></div>
    <!-- Left Goal Area -->
    <div class="absolute top-[35%] bottom-[35%] left-0 w-[5%] border border-white/30 border-l-0"></div>
    <!-- Left Penalty Mark -->
    <div class="absolute top-1/2 left-[11%] w-1 h-1 bg-white/30 rounded-full -translate-y-1/2"></div>
    <!-- Left Arc -->
    <div class="absolute top-1/2 left-[16%] w-[10%] pt-[10%] border border-white/30 rounded-full -translate-y-1/2 -translate-x-[50%] clip-right"></div>
    
    <!-- Right Penalty Box -->
    <div class="absolute top-[20%] bottom-[20%] right-0 w-[16%] border border-white/30 border-r-0"></div>
    <!-- Right Goal Area -->
    <div class="absolute top-[35%] bottom-[35%] right-0 w-[5%] border border-white/30 border-r-0"></div>
    <!-- Right Penalty Mark -->
    <div class="absolute top-1/2 right-[11%] w-1 h-1 bg-white/30 rounded-full -translate-y-1/2"></div>
    <!-- Right Arc -->
    <div class="absolute top-1/2 right-[16%] w-[10%] pt-[10%] border border-white/30 rounded-full -translate-y-1/2 translate-x-[50%] clip-left"></div>

    <!-- Direction Arrow -->
    <div class="absolute top-[5%] right-[10%] text-white/50 text-xs font-bold tracking-widest flex items-center gap-1 opacity-60">
      ATAQUE <span class="text-lg">→</span>
    </div>

    <!-- Shots -->
    <div
      v-for="(shot, index) in normalizedShots"
      :key="index"
      class="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full z-10 -translate-x-1/2 -translate-y-1/2"
      :class="getMarkerClass(shot.type)"
      :style="{ left: `${shot.x}%`, top: `${shot.y}%` }"
      :title="shot.description"
    ></div>
    
    <!-- Legend -->
    <div class="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-1.5 rounded text-[9px] text-white/80 flex flex-col gap-1 border border-white/10 pointer-events-none">
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div> Gol</div>
      <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div> Chute</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
})

// Types: 12 = Shot, 13 = Shot off target, 14 = Shot saved, 15 = Shot blocked, 16 = Goal
// Or based on description
const normalizedShots = computed(() => {
  return props.events
    .filter(e => {
      const desc = (e.TypeLocalized?.[0]?.Description || e.EventDescription?.[0]?.Description || '').toLowerCase()
      const isShotOrGoal = desc.includes('chute') || desc.includes('gol') || e.Type === 16 || (e.Type >= 12 && e.Type <= 15)
      return isShotOrGoal && typeof e.PositionX === 'number' && typeof e.PositionY === 'number'
    })
    .map(e => {
      let x = e.PositionX
      let y = e.PositionY
      
      // Normalize to attacking right
      if (x <= 50) {
        x = 100 - x
        y = 100 - y // invert Y as well to keep relative position
      }
      
      const desc = e.TypeLocalized?.[0]?.Description || e.EventDescription?.[0]?.Description || 'Finalização'
      
      return {
        x,
        y,
        type: e.Type,
        description: desc
      }
    })
})

function getMarkerClass(type) {
  if (type === 16) return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.9)] z-20' // Goal, bring to front
  return 'bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.6)] opacity-80' // Shot
}
</script>

<style scoped>
.clip-right {
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%);
}
.clip-left {
  clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
}
</style>
