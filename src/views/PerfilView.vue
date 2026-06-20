<template>
  <div class="pb-20 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3">
        <h1 class="text-lg font-bold text-white">👤 Perfil</h1>
      </div>
    </header>

    <div class="px-4 py-6 space-y-4">
      <!-- Profile card -->
      <div class="glass rounded-2xl p-6 text-center">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-copa-accent to-copa-accent-light flex items-center justify-center text-3xl font-black text-white mb-4">
          {{ userInitial }}
        </div>
        <h2 class="text-xl font-bold text-white">{{ user?.nome }}</h2>
        <p class="text-sm text-slate-400 mt-1">Membro do bolão</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-2">
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-2xl font-black text-copa-gold">{{ stats.pontos }}</div>
          <div class="text-[10px] text-slate-400 font-semibold mt-1">PONTOS</div>
        </div>
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-2xl font-black text-copa-green">{{ stats.palpites }}</div>
          <div class="text-[10px] text-slate-400 font-semibold mt-1">PALPITES</div>
        </div>
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-2xl font-black text-copa-accent-light">{{ stats.posicao }}</div>
          <div class="text-[10px] text-slate-400 font-semibold mt-1">POSIÇÃO</div>
        </div>
      </div>

      <!-- Detailed stats -->
      <div class="glass rounded-xl p-4 space-y-3">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhamento</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300">🎯 Placares exatos</span>
            <span class="text-sm font-bold text-copa-gold">{{ stats.exatos }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300">📊 Acerto com saldo</span>
            <span class="text-sm font-bold text-blue-400">{{ stats.saldo }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300">✅ Acerto do vencedor</span>
            <span class="text-sm font-bold text-copa-green">{{ stats.vencedor }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300">📋 Jogos computados</span>
            <span class="text-sm font-bold text-slate-300">{{ stats.computados }}</span>
          </div>
        </div>
      </div>

      <!-- Share link -->
      <button
        @click="compartilhar"
        class="w-full glass rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-copa-green font-semibold text-sm tap-scale hover:bg-copa-green/10 transition-colors"
      >
        <span>📤</span>
        <span>Compartilhar no WhatsApp</span>
      </button>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="w-full glass rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-red-400 font-semibold text-sm tap-scale hover:bg-red-500/10 transition-colors"
      >
        <span>🚪</span>
        <span>Sair do Bolão</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRanking } from '@/composables/useRanking'

const { user, logout } = useAuth()
const { ranking, fetchRanking } = useRanking()

const stats = computed(() => {
  const myRank = ranking.value.find(r => r.usuario_id === user.value?.id)
  return {
    pontos: myRank?.pontos ?? 0,
    palpites: myRank?.total_palpites ?? 0,
    posicao: myRank?.posicao ? `${myRank.posicao}º` : '-',
    exatos: myRank?.acertos_exatos ?? 0,
    saldo: myRank?.acertos_saldo ?? 0,
    vencedor: myRank?.acertos_vencedor ?? 0,
    computados: myRank?.jogos_computados ?? 0,
  }
})

const userInitial = computed(() => {
  return user.value?.nome?.charAt(0)?.toUpperCase() || '?'
})

function compartilhar() {
  const text = `⚽ Bolão Copa 2026 ⚽\n\n🏆 ${user.value?.nome} está em ${stats.value.posicao} com ${stats.value.pontos} pontos!\n\nEntra no bolão: ${window.location.origin}`
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

function handleLogout() {
  if (confirm('Tem certeza que quer sair?')) {
    logout()
  }
}
</script>
