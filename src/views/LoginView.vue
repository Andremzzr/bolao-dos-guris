<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8">
    <!-- Background decoration -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-copa-accent/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-copa-gold/10 rounded-full blur-3xl"></div>
    </div>

    <div class="w-full max-w-sm relative z-10 animate-slide-up">
      <!-- Logo / Header -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-3">⚽</div>
        <h1 class="text-3xl font-black gradient-text">Bolão 2026</h1>
        <p class="text-slate-400 text-sm mt-2">Copa do Mundo FIFA</p>
      </div>

      <!-- Login Card -->
      <div class="glass rounded-2xl p-6 space-y-5">
        <div>
          <label for="nome" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Seu Nome
          </label>
          <input
            id="nome"
            ref="nomeInput"
            v-model="nome"
            type="text"
            placeholder="Como vão te chamar?"
            autocomplete="off"
            class="w-full bg-slate-800/50 border border-copa-border rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-copa-accent focus:border-transparent transition-all duration-200"
            @keyup.enter="$refs.senhaInput?.focus()"
          />
        </div>

        <div>
          <label for="senha" class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Senha do Grupo
          </label>
          <input
            id="senha"
            ref="senhaInput"
            v-model="senha"
            type="password"
            placeholder="Senha compartilhada do grupo"
            class="w-full bg-slate-800/50 border border-copa-border rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-copa-accent focus:border-transparent transition-all duration-200"
            @keyup.enter="handleLogin"
          />
        </div>

        <!-- Error message -->
        <Transition enter-active-class="animate-slide-up">
          <div
            v-if="error"
            class="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm text-center"
          >
            {{ error }}
          </div>
        </Transition>

        <!-- Login button -->
        <button
          id="btn-login"
          @click="handleLogin"
          :disabled="loading || !nome.trim() || !senha.trim()"
          class="w-full bg-gradient-to-r from-copa-accent to-copa-accent-light text-white font-bold py-3.5 rounded-xl transition-all duration-200 tap-scale disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-copa-accent/25"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Entrando...
          </span>
          <span v-else>Entrar no Bolão 🎉</span>
        </button>
      </div>

      <!-- Footer -->
      <p class="text-center text-slate-500 text-xs mt-6">
        Primeiro acesso? Basta escolher seu nome e a senha do grupo.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { login, loading, error } = useAuth()

const nome = ref('')
const senha = ref('')
const nomeInput = ref(null)

onMounted(() => {
  // Auto-focus on name input
  setTimeout(() => nomeInput.value?.focus(), 300)
})

async function handleLogin() {
  if (!nome.value.trim() || !senha.value.trim()) return
  await login(nome.value, senha.value)
}
</script>
