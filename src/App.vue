<template>
  <div class="w-full max-w-md mx-auto min-h-screen relative bg-copa-bg">
    <!-- Toast Notification -->
    <Transition
      enter-active-class="toast-enter"
      leave-active-class="toast-leave"
    >
      <div
        v-if="toast"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)]"
      >
        <div
          :class="[
            'px-4 py-3 rounded-xl text-center text-sm font-semibold shadow-lg',
            toast.type === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-copa-green/90 text-white'
          ]"
        >
          {{ toast.message }}
        </div>
      </div>
    </Transition>

    <!-- Main Content Area -->
    <router-view v-slot="{ Component }">
      <Transition
        enter-active-class="animate-fade-in"
        mode="out-in"
      >
        <component :is="Component" />
      </Transition>
    </router-view>

    <!-- Bottom Navigation Bar -->
    <nav
      v-if="isLoggedIn"
      class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass border-t border-copa-border z-40 pb-safe"
    >
      <div class="flex items-center justify-around h-16">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="flex flex-col items-center justify-center flex-1 h-full tap-scale transition-colors duration-200"
          :class="[
            $route.name === tab.name
              ? 'text-copa-gold'
              : 'text-slate-400 hover:text-slate-200'
          ]"
        >
          <component :is="tab.icon" :size="26" :weight="$route.name === tab.name ? 'fill' : 'regular'" class="mb-0.5" />
          <span class="text-[10px] font-semibold tracking-wide uppercase">{{ tab.label }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed, provide } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useJogos } from '@/composables/useJogos'
import { PhSoccerBall, PhTrophy, PhUser } from '@phosphor-icons/vue'

const { isLoggedIn } = useAuth()
const { toast } = useJogos()

const tabs = [
  { icon: PhSoccerBall, label: 'Jogos', to: '/', name: 'jogos' },
  { icon: PhTrophy, label: 'Ranking', to: '/ranking', name: 'ranking' },
  { icon: PhUser, label: 'Perfil', to: '/perfil', name: 'perfil' },
]
</script>
