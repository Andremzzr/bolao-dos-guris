<template>
  <div class="relative w-full max-w-[280px] mx-auto aspect-[105/68] bg-[#1a4a2c] rounded border-2 border-white/20 overflow-hidden shadow-inner flex items-center justify-center">
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

    <!-- Active Event Marker -->
    <div
      v-if="hasPosition"
      :key="activeEvent?.EventId || 'marker'"
      class="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full z-10 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] -translate-x-1/2 -translate-y-1/2"
      :class="markerClass"
      :style="{ left: `${currentPositionX}%`, top: `${currentPositionY}%` }"
    >
      <div class="absolute inset-0 rounded-full animate-ping opacity-60" :class="markerPingClass"></div>
    </div>
    
    <!-- Event Label without Position -->
    <Transition enter-active-class="transition-opacity duration-300" leave-active-class="transition-opacity duration-300" enter-from-class="opacity-0" leave-to-class="opacity-0">
      <div 
        v-if="activeEvent && !hasPosition"
        class="absolute z-10 pointer-events-none px-3 py-1 bg-black/60 rounded-full backdrop-blur-sm border border-white/10 text-[10px] text-white font-bold tracking-wide"
      >
        {{ eventType }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  activeEvent: {
    type: Object,
    default: null
  }
})

const hasPosition = computed(() => {
  return props.activeEvent && typeof props.activeEvent.PositionX === 'number' && typeof props.activeEvent.PositionY === 'number'
})

const currentPositionX = ref(50)
const currentPositionY = ref(50)

watch(() => props.activeEvent, (newEvent) => {
  if (newEvent && typeof newEvent.PositionX === 'number' && typeof newEvent.PositionY === 'number') {
    currentPositionX.value = newEvent.PositionX
    currentPositionY.value = newEvent.PositionY
    
    const description = (newEvent.TypeLocalized?.[0]?.Description || newEvent.EventDescription?.[0]?.Description || '').toLowerCase()
    const isShotOrGoal = description.includes('chute') || description.includes('gol') || newEvent.Type === 16 || (newEvent.Type >= 12 && newEvent.Type <= 15)
    
    if (isShotOrGoal) {
      const targetX = newEvent.PositionX > 50 ? 100 : 0
      const targetY = 50
      
      setTimeout(() => {
        if (props.activeEvent === newEvent) {
          currentPositionX.value = targetX
          currentPositionY.value = targetY
        }
      }, 800)
    }
  }
}, { immediate: true })

const eventType = computed(() => {
  if (!props.activeEvent) return ''
  return props.activeEvent.TypeLocalized?.[0]?.Description || props.activeEvent.EventDescription?.[0]?.Description || 'Evento'
})

const typeId = computed(() => {
  return props.activeEvent?.Type || 0
})

// Types (based on standard football feeds like Sportradar/Opta):
// 12 = Shot, 13 = Shot off target, 14 = Shot saved, 15 = Shot blocked, 16 = Goal
// 18 = Foul, 19 = Card, etc.
const markerClass = computed(() => {
  if (typeId.value === 16) return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]' // Goal
  if (typeId.value >= 12 && typeId.value <= 15) return 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]' // Shot
  if (typeId.value === 18) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' // Foul
  if (typeId.value === 19) return 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.8)]' // Card
  return 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
})

const markerPingClass = computed(() => {
  if (typeId.value === 16) return 'bg-yellow-400'
  if (typeId.value >= 12 && typeId.value <= 15) return 'bg-blue-400'
  if (typeId.value === 18) return 'bg-red-500'
  if (typeId.value === 19) return 'bg-orange-400'
  return 'bg-white'
})
</script>

<style scoped>
.clip-right {
  clip-path: polygon(50% 0, 100% 0, 100% 100%, 50% 100%);
}
.clip-left {
  clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);
}
</style>
