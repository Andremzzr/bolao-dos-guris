<template>
  <div class="pb-20 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3">
        <h1 class="text-lg font-bold text-white">🏆 Classificação</h1>
        <p class="text-xs text-slate-400">Quem está na frente?</p>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <svg class="animate-spin h-8 w-8 text-copa-accent" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Ranking list -->
    <div v-else class="px-3 py-3 space-y-2">
      <!-- Podium (top 3) -->
      <div
        v-for="(player, index) in ranking"
        :key="player.usuario_id"
        class="animate-slide-up"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <div
          class="glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-200"
          :class="{
            'ring-1 ring-copa-gold/40 bg-copa-gold/5': player.posicao === 1,
            'ring-1 ring-copa-silver/30 bg-copa-silver/5': player.posicao === 2,
            'ring-1 ring-copa-bronze/30 bg-copa-bronze/5': player.posicao === 3,
            'ring-1 ring-copa-accent/20 bg-copa-accent/5': isCurrentUser(player),
          }"
        >
          <!-- Position -->
          <div class="shrink-0 w-8 text-center">
            <span v-if="player.posicao === 1" class="text-2xl">🥇</span>
            <span v-else-if="player.posicao === 2" class="text-2xl">🥈</span>
            <span v-else-if="player.posicao === 3" class="text-2xl">🥉</span>
            <span v-else class="text-lg font-bold text-slate-500">{{ player.posicao }}º</span>
          </div>

          <!-- Name + stats -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span
                class="font-bold text-sm truncate"
                :class="isCurrentUser(player) ? 'text-copa-accent-light' : 'text-white'"
              >
                {{ player.nome }}
              </span>
              <span v-if="isCurrentUser(player)" class="text-[10px] text-copa-accent font-semibold">(você)</span>
            </div>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] text-slate-500">
                {{ player.jogos_computados || 0 }} jogos
              </span>
              <span v-if="player.acertos_exatos > 0" class="text-[10px] text-copa-gold">
                🎯 {{ player.acertos_exatos }}
              </span>
            </div>
          </div>

          <!-- Points -->
          <div class="shrink-0 text-right">
            <div
              class="text-xl font-black"
              :class="{
                'text-copa-gold': player.posicao === 1,
                'text-copa-silver': player.posicao === 2,
                'text-copa-bronze': player.posicao === 3,
                'text-white': player.posicao > 3,
              }"
            >
              {{ player.pontos }}
            </div>
            <div class="text-[10px] text-slate-500 font-semibold">pts</div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="ranking.length === 0 && !loading" class="text-center py-16">
        <div class="text-4xl mb-3">🏟️</div>
        <p class="text-slate-400 font-medium">Nenhum resultado ainda</p>
        <p class="text-slate-500 text-sm mt-1">O ranking será atualizado quando os jogos forem finalizados.</p>
      </div>
    </div>

    <!-- Scoring legend -->
    <div class="px-3 mt-4 mb-4">
      <div class="glass rounded-xl p-4">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pontuação</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-300">🎯 Placar exato</span>
            <span class="font-bold text-copa-gold">25 pts</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-300">📊 Vencedor + saldo</span>
            <span class="font-bold text-blue-400">18 pts</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-300">✅ Apenas vencedor</span>
            <span class="font-bold text-copa-green">10 pts</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-300">❌ Errou</span>
            <span class="font-bold text-red-400">0 pts</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRanking } from '@/composables/useRanking'
import { useAuth } from '@/composables/useAuth'

const { ranking, loading } = useRanking()
const { user } = useAuth()

function isCurrentUser(player) {
  return player.usuario_id === user.value?.id
}
</script>
