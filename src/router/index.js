import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'jogos',
    component: () => import('@/views/JogosView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ranking',
    name: 'ranking',
    component: () => import('@/views/RankingView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/racing',
    name: 'racing',
    component: () => import('@/views/RacingView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('@/views/PerfilView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/jogos/:id/estatisticas',
    name: 'estatisticas-jogo',
    component: () => import('@/views/EstatisticasJogoView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/estatisticas',
    name: 'estatisticas',
    component: () => import('@/views/EstatisticasSelecaoView.vue'),
    meta: { requiresAuth: true },
  },

  {
    path: '/torneio',
    name: 'torneio',
    component: () => import('@/views/GruposView.vue'),
    meta: { requiresAuth: true },
  },

  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
  },
  {
    path: '/admin/cartas',
    name: 'admin-cartas',
    component: () => import('@/views/AdminCartasView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const userId = localStorage.getItem('bolao_user_id')
  if (to.meta.requiresAuth && !userId) {
    next({ name: 'login' })
  } else if (to.name === 'login' && userId) {
    next({ name: 'jogos' })
  } else {
    next()
  }
})

export default router
