<template>
  <div class="rounded-2xl overflow-hidden border border-copa-border bg-copa-surface">
    <!-- Group header -->
    <div class="px-4 py-3 bg-gradient-to-r from-copa-accent/20 to-copa-surface border-b border-copa-border flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xl font-black text-white tracking-tight">GRUPO {{ grupo }}</span>
        <span
          v-if="completo"
          class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        >CONCLUÍDO</span>
        <span
          v-else-if="jogosJogados > 0"
          class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
        >{{ jogosJogados }}/6 JOGOS</span>
        <span
          v-else
          class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-500 border border-slate-700"
        >EM BREVE</span>
      </div>
    </div>

    <!-- Table: left panel (fixed) + right panel (scrollable) -->
    <div class="flex">
      <!-- ── LEFT: status bar + pos badge + flag + name (always visible) ── -->
      <div class="shrink-0 w-[148px]">
        <!-- Header -->
        <div class="flex items-center h-8 border-b border-copa-border bg-copa-surface-light/20 px-2">
          <span class="text-[9px] text-slate-500 font-semibold">Seleção</span>
        </div>
        <!-- Rows -->
        <div
          v-for="time in times"
          :key="time.nome"
          class="flex items-center h-[46px] border-b border-copa-border/40 last:border-0 relative pl-0"
          :class="rowBg(time)"
        >
          <!-- Status side bar -->
          <div
            class="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full shrink-0"
            :class="sidebarColor(time)"
          ></div>

          <!-- Position badge -->
          <div class="flex items-center justify-center w-7 shrink-0 ml-1.5">
            <span
              class="text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center"
              :class="badgeClass(time)"
            >{{ time.pos }}</span>
          </div>

          <!-- Flag -->
          <img
            v-if="getFlagUrl(time.nome)"
            :src="getFlagUrl(time.nome)"
            :alt="time.nome"
            loading="lazy"
            class="w-6 h-4 object-cover rounded-sm shadow-sm shrink-0 mr-1.5"
          />

          <!-- Name -->
          <span class="text-white text-[11px] font-semibold truncate pr-1">{{ time.nome }}</span>
        </div>
      </div>

      <!-- ── RIGHT: scrollable stats ── -->
      <div class="flex-1 overflow-x-auto" style="scrollbar-width: none; -ms-overflow-style: none;">
        <div class="min-w-[224px]">
          <!-- Header -->
          <div class="flex items-center h-8 border-b border-copa-border bg-copa-surface-light/20">
            <span v-for="col in statCols" :key="col.key"
              class="text-[9px] text-slate-500 font-semibold text-center shrink-0"
              :style="{ width: col.w }"
              :title="col.title"
            >{{ col.label }}</span>
          </div>
          <!-- Rows -->
          <div
            v-for="time in times"
            :key="time.nome"
            class="flex items-center h-[46px] border-b border-copa-border/40 last:border-0"
            :class="rowBg(time)"
          >
            <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.pj }}</span>
            <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.vit }}</span>
            <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.e }}</span>
            <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.der }}</span>
            <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.gm }}</span>
            <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.gc }}</span>
            <span
              class="text-xs font-semibold text-center shrink-0"
              style="width:2.2rem"
              :class="time.sg > 0 ? 'text-emerald-400' : time.sg < 0 ? 'text-red-400' : 'text-slate-400'"
            >{{ time.sg > 0 ? '+' : '' }}{{ time.sg }}</span>
            <span class="text-xs font-black text-white text-center shrink-0" style="width:2.2rem">{{ time.pts }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getFlagUrl } from '@/utils/flags'

const props = defineProps({
  grupo: { type: String, required: true },
  times: { type: Array, required: true },
  completo: { type: Boolean, default: false },
  jogosJogados: { type: Number, default: 0 },
  getStatus: { type: Function, required: true },
  grupoComTerceiro: { type: Object, required: true },
})

const statCols = [
  { key: 'pj',  label: 'PJ',  title: 'Partidas Jogadas', w: '2rem' },
  { key: 'vit', label: 'VIT', title: 'Vitórias',          w: '2rem' },
  { key: 'e',   label: 'E',   title: 'Empates',           w: '2rem' },
  { key: 'der', label: 'DER', title: 'Derrotas',          w: '2rem' },
  { key: 'gm',  label: 'GM',  title: 'Gols Marcados',     w: '2rem' },
  { key: 'gc',  label: 'GC',  title: 'Gols Contra',       w: '2rem' },
  { key: 'sg',  label: 'SG',  title: 'Saldo de Gols',     w: '2.2rem' },
  { key: 'pts', label: 'Pts', title: 'Pontos',             w: '2.2rem' },
]

function rowBg(time) {
  const status = props.getStatus(time.pos, props.grupo)
  if (status === 'advance') return 'bg-emerald-500/5'
  if (status === 'possible_confirmed' || status === 'possible') return 'bg-amber-500/5'
  return ''
}

function sidebarColor(time) {
  const status = props.getStatus(time.pos, props.grupo)
  if (status === 'advance') return 'bg-emerald-500'
  if (status === 'possible_confirmed' || status === 'possible') return 'bg-amber-500'
  return 'bg-red-500/40'
}

function badgeClass(time) {
  const status = props.getStatus(time.pos, props.grupo)
  if (status === 'advance') return 'bg-emerald-500/20 text-emerald-400'
  if (status === 'possible_confirmed') return 'bg-amber-500/25 text-amber-400'
  if (status === 'possible') return 'bg-amber-500/15 text-amber-500'
  return 'bg-red-500/15 text-red-500/70'
}
</script>
