<template>
  <div class="card-magic group relative w-full aspect-[2.5/3.5] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2 hover:shadow-copa-accent/50 cursor-pointer">
    <!-- Border/Frame -->
    <div class="absolute inset-0 p-[4%] bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-xl">
      <!-- Card Inner -->
      <div class="relative w-full h-full bg-slate-200 rounded-lg overflow-hidden flex flex-col border border-slate-700/50 shadow-inner">
        
        <!-- Header -->
        <div class="px-3 py-2 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 border-b-2 border-slate-400 flex items-center justify-between z-10 shadow-sm relative">
          <h3 class="text-sm font-black text-slate-900 tracking-tight leading-none drop-shadow-sm font-serif">{{ title }}</h3>
          <div class="flex gap-1">
            <div class="w-4 h-4 rounded-full bg-copa-accent shadow-inner border border-black/20 flex items-center justify-center">
              <span class="text-[8px] font-bold text-white">5</span>
            </div>
          </div>
        </div>
        
        <!-- Image Box -->
        <div class="relative w-full aspect-[4/3] bg-black p-1 border-b-2 border-slate-400 shadow-inner z-10">
          <div class="w-full h-full border border-slate-600 rounded-sm overflow-hidden relative group-hover:brightness-110 transition-all">
            <img v-if="imageUrl" :src="imageUrl" :alt="title" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-slate-800 flex items-center justify-center">
              <PhImage :size="32" class="text-slate-500" />
            </div>
          </div>
        </div>

        <!-- Type Line -->
        <div class="px-3 py-1.5 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 border-b-2 border-slate-400 flex items-center justify-between z-10 shadow-sm">
          <span class="text-[10px] font-bold text-slate-800 font-serif">Recompensa — Placar Exato</span>
          <div class="w-3 h-3 text-slate-500 opacity-50">
            <PhStar weight="fill" />
          </div>
        </div>

        <!-- Text Box -->
        <div class="flex-1 bg-gradient-to-br from-[#e6dfcc] to-[#d6ceb5] p-3 text-slate-800 relative z-10 border border-t-0 border-white/40 overflow-y-auto custom-scrollbar">
          <!-- Text background texture hint -->
          <div class="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] pointer-events-none"></div>
          
          <p class="text-xs leading-relaxed font-serif relative z-10">{{ description }}</p>
          
          <div class="absolute bottom-2 right-2 opacity-50 flex items-center gap-1 z-10">
            <span class="text-[8px] font-bold tracking-widest text-slate-600">COPA26</span>
          </div>
        </div>

      </div>
    </div>
    
    <!-- Foil/Holographic overlay effect -->
    <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20 mix-blend-overlay -translate-x-full group-hover:translate-x-full ease-in-out"></div>
  </div>
</template>

<script setup>
import { PhImage, PhStar } from '@phosphor-icons/vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.font-serif {
  font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 4px;
}
</style>
