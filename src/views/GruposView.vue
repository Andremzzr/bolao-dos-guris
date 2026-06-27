<template>
  <div class="pb-24 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="px-4 pt-4 pb-0">
        <div class="flex items-center gap-2 mb-3">
          <PhGridFour :size="22" weight="fill" class="text-copa-gold" />
          <div>
            <h1 class="text-base font-bold text-white leading-tight">Fase do Torneio</h1>
            <p class="text-[10px] text-slate-400">Copa do Mundo 2026</p>
          </div>
        </div>

        <!-- View Tabs -->
        <div class="flex gap-2 mb-3">
          <button @click="viewMode = 'grupos'" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border" :class="viewMode === 'grupos' ? 'bg-copa-accent text-white border-copa-accent shadow-lg shadow-copa-accent/30' : 'bg-copa-surface text-slate-400 border-copa-border'">Grupos</button>
          <button @click="viewMode = 'matamata'" class="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border" :class="viewMode === 'matamata' ? 'bg-copa-accent text-white border-copa-accent shadow-lg shadow-copa-accent/30' : 'bg-copa-surface text-slate-400 border-copa-border'">Mata-Mata</button>
        </div>

        <!-- Group tabs scrollable -->
        <div
          v-show="viewMode === 'grupos'"
          ref="tabsContainer"
          class="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none snap-x"
          style="scrollbar-width: none; -ms-overflow-style: none;"
        >
          <button
            v-for="g in GRUPOS"
            :key="g"
            @click="selectGrupo(g)"
            :id="`tab-grupo-${g}`"
            class="snap-start shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 tap-scale border"
            :class="
              grupoAtivo === g
                ? 'bg-copa-accent text-white border-copa-accent shadow-lg shadow-copa-accent/30'
                : 'bg-copa-surface text-slate-400 border-copa-border hover:text-white hover:border-slate-500'
            "
          >
            {{ g }}
          </button>
        </div>
      </div>
    </header>

    <!-- Mata-Mata Content -->
    <div v-if="viewMode === 'matamata'" class="pt-4 animate-fade-in">
      <MataMataBracket />
    </div>

    <!-- Grupos Content -->
    <div v-show="viewMode === 'grupos'" class="px-3 pt-4 space-y-4">
      <!-- Group standings card -->
      <div
        v-for="g in GRUPOS"
        v-show="grupoAtivo === g"
        :key="g"
        class="animate-fade-in"
      >
        <GroupCard
          :grupo="g"
          :times="gruposCalculados[g] || []"
          :completo="grupoCompleto(g)"
          :jogos-jogados="jogosPorGrupo(g)"
          :get-status="statusTime"
          :grupo-com-terceiro="gruposComTerceiroClassificado"
        />
      </div>

      <!-- Best 3rds section -->
      <div class="mt-2 animate-fade-in">
        <div class="flex items-center gap-2 mb-3 px-1">
          <PhMedal :size="18" weight="fill" class="text-copa-gold" />
          <h2 class="text-sm font-bold text-white">Melhores 3ºs Colocados</h2>
        </div>

        <div class="rounded-2xl overflow-hidden border border-copa-border bg-copa-surface">
          <!-- Explanation banner -->
          <div class="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
            <PhInfo :size="14" class="text-amber-400 shrink-0" />
            <p class="text-[11px] text-amber-300/80 leading-tight">
              Os 8 melhores 3ºs colocados entre os 12 grupos avançam para as Oitavas de Final
            </p>
          </div>

          <!-- Split layout: fixed left (rank, flag, name) + scrollable right (stats) -->
          <div class="flex">
            <!-- LEFT PANEL: # and Seleção -->
            <div class="shrink-0 w-[148px]">
              <!-- Header -->
              <div class="flex items-center h-8 border-b border-copa-border bg-copa-surface-light/30 px-2">
                <span class="text-[9px] text-slate-500 font-semibold w-7 text-center">#</span>
                <span class="text-[9px] text-slate-500 font-semibold pl-1">Seleção</span>
              </div>
              
              <!-- Rows -->
              <div
                v-for="(time, idx) in terceirosOrdenados"
                :key="'left-' + time.grupo"
                @click="goToGrupo(time.grupo)"
                class="flex items-center h-[46px] border-b border-copa-border/40 last:border-0 transition-all duration-150 cursor-pointer hover:bg-white/5 active:bg-white/10"
                :class="idx < 8 ? 'bg-emerald-500/5' : ''"
              >
                <!-- Rank badge -->
                <div class="flex items-center justify-center w-7 shrink-0 ml-1.5">
                  <span
                    class="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    :class="
                      idx < 8
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/50 text-slate-500'
                    "
                  >{{ idx + 1 }}</span>
                </div>

                <!-- Flag -->
                <img
                  v-if="getFlagUrl(time.nome)"
                  :src="getFlagUrl(time.nome)"
                  :alt="time.nome"
                  loading="lazy"
                  class="w-6 h-4 object-cover rounded-sm shadow-sm shrink-0 ml-1 mr-1.5"
                />

                <!-- Name -->
                <span class="text-white text-[11px] font-semibold truncate pr-1">{{ time.nome }}</span>
              </div>
            </div>

            <!-- RIGHT PANEL: Stats (scrollable) -->
            <div class="flex-1 overflow-x-auto" style="scrollbar-width: none; -ms-overflow-style: none;">
              <div class="min-w-[224px]">
                <!-- Header -->
                <div class="flex items-center h-8 border-b border-copa-border bg-copa-surface-light/30">
                  <span class="text-[9px] text-slate-500 font-semibold text-center shrink-0" style="width:2.2rem">Pts</span>
                  <span class="text-[9px] text-slate-500 font-semibold text-center shrink-0" style="width:2rem">PJ</span>
                  <span class="text-[9px] text-slate-500 font-semibold text-center shrink-0" style="width:2rem">VIT</span>
                  <span class="text-[9px] text-slate-500 font-semibold text-center shrink-0" style="width:2rem">E</span>
                  <span class="text-[9px] text-slate-500 font-semibold text-center shrink-0" style="width:2rem">DER</span>
                  <span class="text-[9px] text-slate-500 font-semibold text-center shrink-0" style="width:2rem">GM</span>
                  <span class="text-[9px] text-slate-500 font-semibold text-center shrink-0" style="width:2rem">GC</span>
                  <span class="text-[9px] text-slate-500 font-semibold text-center shrink-0" style="width:2.2rem">SG</span>
                </div>

                <!-- Rows -->
                <div
                  v-for="(time, idx) in terceirosOrdenados"
                  :key="'right-' + time.grupo"
                  @click="goToGrupo(time.grupo)"
                  class="flex items-center h-[46px] border-b border-copa-border/40 last:border-0 transition-all duration-150 cursor-pointer hover:bg-white/5 active:bg-white/10"
                  :class="idx < 8 ? 'bg-emerald-500/5' : ''"
                >
                  <span class="text-xs font-bold text-white text-center shrink-0" style="width:2.2rem">{{ time.pts }}</span>
                  <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.pj }}</span>
                  <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.vit }}</span>
                  <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.e }}</span>
                  <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.der }}</span>
                  <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.gm }}</span>
                  <span class="text-xs text-slate-300 text-center shrink-0" style="width:2rem">{{ time.gc }}</span>
                  <span class="text-xs font-semibold text-center shrink-0" style="width:2.2rem" :class="time.sg > 0 ? 'text-emerald-400' : time.sg < 0 ? 'text-red-400' : 'text-slate-400'">
                    {{ time.sg > 0 ? '+' : '' }}{{ time.sg }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="!terceirosOrdenados.length" class="py-8 text-center text-slate-500 text-sm">
            Aguardando resultados...
          </div>
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap gap-3 mt-3 px-1">
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span class="text-[10px] text-slate-400">Classificado (Top 8)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
            <span class="text-[10px] text-slate-400">Eliminado</span>
          </div>
        </div>
      </div>

      <!-- Overall legend -->
      <div class="flex flex-wrap gap-3 px-1 pb-2">
        <div class="flex items-center gap-1.5">
          <div class="w-1 h-4 rounded-full bg-emerald-500"></div>
          <span class="text-[10px] text-slate-400">1º e 2º — Classificados</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-1 h-4 rounded-full bg-amber-500"></div>
          <span class="text-[10px] text-slate-400">3º — Possível classificação</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-1 h-4 rounded-full bg-red-500/60"></div>
          <span class="text-[10px] text-slate-400">4º — Eliminado</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { PhGridFour, PhMedal, PhInfo } from '@phosphor-icons/vue'
import { useGrupos } from '@/composables/useGrupos'
import { useJogos } from '@/composables/useJogos'
import { getFlagUrl } from '@/utils/flags'
import GroupCard from '@/components/GroupCard.vue'
import MataMataBracket from '@/components/MataMataBracket.vue'

const { GRUPOS, gruposCalculados, terceirosOrdenados, gruposComTerceiroClassificado, statusTime, grupoCompleto, jogosPorGrupo } = useGrupos()
const { fetchResultados } = useJogos()

const viewMode = ref('grupos')
const grupoAtivo = ref('A')
const tabsContainer = ref(null)

async function selectGrupo(g) {
  grupoAtivo.value = g
  await nextTick()
  // Scroll the selected tab into view
  const el = document.getElementById(`tab-grupo-${g}`)
  if (el && tabsContainer.value) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }
}

// Called when clicking a team in the best-thirds table
// Switches to that team's group and scrolls back up to the standings
async function goToGrupo(grupo) {
  await selectGrupo(grupo)
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  await fetchResultados()
})
</script>
