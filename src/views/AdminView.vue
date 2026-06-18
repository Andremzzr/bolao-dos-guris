<template>
  <div class="p-4 pb-24 min-h-screen">
    <!-- Header -->
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-copa-gold to-yellow-200 uppercase tracking-tight">
          Admin
        </h1>
        <p class="text-sm text-slate-400 font-medium mt-1">Gerenciar resultados</p>
      </div>
      <router-link
        to="/"
        class="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 hover:text-white transition-colors"
      >
        ✕
      </router-link>
    </header>

    <!-- Login Area -->
    <div v-if="!isAuthenticated" class="glass rounded-2xl p-6 shadow-xl border border-white/10 mt-10">
      <h2 class="text-xl font-bold text-white mb-4 text-center">Acesso Restrito</h2>
      <p class="text-sm text-slate-400 mb-6 text-center">
        Digite a senha de administrador para inserir os resultados dos jogos.
      </p>
      <form @submit.prevent="login" class="space-y-4">
        <div>
          <input
            v-model="password"
            type="password"
            placeholder="Senha Admin"
            class="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-copa-gold focus:ring-1 focus:ring-copa-gold transition-all"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full bg-gradient-to-r from-copa-gold to-yellow-500 text-slate-900 font-bold py-3 rounded-xl shadow-lg hover:shadow-copa-gold/20 hover:scale-[1.02] transition-all active:scale-95"
        >
          Entrar
        </button>
        <p v-if="loginError" class="text-red-400 text-xs text-center font-semibold animate-pulse">
          Senha incorreta!
        </p>
      </form>
    </div>

    <!-- Admin Panel -->
    <div v-else>
      <div v-if="loading" class="flex justify-center py-10">
        <div class="w-8 h-8 border-4 border-copa-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div v-else class="space-y-4">
        <!-- Loop over dates -->
        <div v-for="(jogos, dataStr) in jogosPorData" :key="dataStr" class="space-y-4">
          <h3 class="text-sm font-bold text-copa-gold uppercase tracking-wider sticky top-0 bg-copa-bg/90 backdrop-blur py-2 z-10 border-b border-white/5">
            {{ dataStr }}
          </h3>
          
          <div
            v-for="jogo in jogos"
            :key="jogo.id"
            class="glass rounded-xl p-4 transition-all duration-300"
            :class="{ 'ring-1 ring-copa-green/50 bg-copa-green/5': resultados[jogo.id]?.finalizado }"
          >
            <!-- Game Info -->
            <div class="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <span class="text-[10px] font-bold text-slate-500 uppercase">
                {{ jogo.fase?.replace('Fase de Grupos - ', '') }}
              </span>
              <span class="text-[10px] text-slate-400">
                {{ new Date(jogo.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>

            <!-- Teams & Inputs -->
            <div class="flex items-center gap-2 mb-4">
              <!-- Home -->
              <div class="flex-1 flex justify-end items-center gap-2">
                <span class="text-xs font-bold text-white leading-tight text-right">{{ jogo.mandante }}</span>
              </div>

              <!-- Inputs -->
              <div class="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  v-model.number="inputs[jogo.id].home"
                  min="0"
                  max="20"
                  class="w-10 h-10 text-center bg-slate-800 text-white font-black text-lg border border-slate-600 rounded-lg focus:outline-none focus:border-copa-gold transition-colors"
                />
                <span class="text-slate-500 text-xs font-bold">×</span>
                <input
                  type="number"
                  v-model.number="inputs[jogo.id].away"
                  min="0"
                  max="20"
                  class="w-10 h-10 text-center bg-slate-800 text-white font-black text-lg border border-slate-600 rounded-lg focus:outline-none focus:border-copa-gold transition-colors"
                />
              </div>

              <!-- Away -->
              <div class="flex-1 flex justify-start items-center gap-2">
                <span class="text-xs font-bold text-white leading-tight text-left">{{ jogo.visitante }}</span>
              </div>
            </div>

            <!-- Controls -->
            <div class="flex items-center justify-between gap-3 pt-2">
              <label class="flex items-center gap-2 cursor-pointer tap-scale">
                <div class="relative flex items-center">
                  <input type="checkbox" v-model="inputs[jogo.id].finalizado" class="sr-only peer" />
                  <div class="w-9 h-5 bg-slate-700 rounded-full peer peer-checked:bg-copa-green peer-focus:ring-2 peer-focus:ring-copa-green/30 transition-all"></div>
                  <div class="absolute left-[2px] top-[2px] w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-full"></div>
                </div>
                <span class="text-xs font-bold text-slate-300 peer-checked:text-copa-green transition-colors">
                  FINALIZADO
                </span>
              </label>

              <button
                @click="salvar(jogo.id)"
                :disabled="saving['admin_'+jogo.id]"
                class="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 tap-scale"
                :class="{'bg-copa-gold text-slate-900 hover:bg-yellow-400': hasChanges(jogo.id)}"
              >
                <span v-if="saving['admin_'+jogo.id]" class="flex items-center gap-1">
                  <svg class="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando
                </span>
                <span v-else>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useJogos } from '@/composables/useJogos'

const { 
  jogosPorData, 
  jogosData,
  resultados, 
  fetchResultados, 
  upsertResultado,
  saving 
} = useJogos()

const isAuthenticated = ref(false)
const password = ref('')
const loginError = ref(false)
const loading = ref(true)

// Reactive object to store local edits before saving
const inputs = reactive({})

async function login() {
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD
  
  if (!envPassword) {
    alert("ERRO: A variável VITE_ADMIN_PASSWORD não foi definida no .env")
    return
  }

  if (password.value === envPassword) {
    isAuthenticated.value = true
    loginError.value = false
    await initAdmin()
  } else {
    loginError.value = true
    setTimeout(() => { loginError.value = false }, 2000)
  }
}

async function initAdmin() {
  loading.value = true
  await fetchResultados()
  
  // Populate inputs with existing results or defaults
  jogosData.forEach(jogo => {
    const r = resultados.value[jogo.id]
    inputs[jogo.id] = {
      home: r?.gols_mandante ?? 0,
      away: r?.gols_visitante ?? 0,
      finalizado: r?.finalizado ?? false,
    }
  })
  
  loading.value = false
}

function hasChanges(jogoId) {
  const r = resultados.value[jogoId]
  const i = inputs[jogoId]
  if (!r) {
    return i.home !== 0 || i.away !== 0 || i.finalizado !== false
  }
  return r.gols_mandante !== i.home || 
         r.gols_visitante !== i.away || 
         r.finalizado !== i.finalizado
}

async function salvar(jogoId) {
  const i = inputs[jogoId]
  await upsertResultado(jogoId, i.home, i.away, i.finalizado)
}
</script>
