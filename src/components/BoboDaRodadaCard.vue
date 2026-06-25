<template>
  <div class="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
    <!-- Componente escondido para ser renderizado pelo html2canvas -->
    <div
      ref="cardRef"
      class="w-[1080px] h-[1920px] flex flex-col justify-between p-16 relative overflow-hidden bg-slate-900"
      style="font-family: 'Inter', sans-serif;"
    >
      <!-- Background Effects -->
      <div class="absolute inset-0 z-0">
        <div class="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-red-500/30 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-500/20 rounded-full blur-[120px]"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/80 to-slate-900"></div>
      </div>

      <!-- Header / Top -->
      <div class="relative z-10 flex flex-col items-center mt-20">
        <PhBone :size="18" />
        <h1 class="text-7xl font-black text-white text-center tracking-tight mb-4 uppercase">
          Bobo da Rodada
        </h1>
        <div class="text-3xl text-red-300 font-medium tracking-widest bg-white/10 px-8 py-3 rounded-full backdrop-blur-sm">
          {{ formattedDate }}
        </div>
      </div>

      <!-- Main Content / Center -->
      <div class="relative z-10 flex flex-col items-center justify-center flex-1">
        <!-- Avatar Placeholder or Initials -->
        <div class="w-64 h-64 rounded-full bg-gradient-to-tr from-red-600 to-orange-400 p-2 mb-6 shadow-2xl shadow-red-500/20">
          <img v-if="player.avatar_url" :src="player.avatar_url" class="w-full h-full object-cover rounded-full border-4 border-slate-900" alt="Avatar" crossorigin="anonymous" />
          <div v-else class="w-full h-full bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-900">
            <span class="text-8xl font-black text-white">
              {{ player.nome?.charAt(0).toUpperCase() || '?' }}
            </span>
          </div>
        </div>

        <h2 class="text-7xl font-black text-white text-center mb-6 leading-tight drop-shadow-md">
          {{ player.nome }}
        </h2>
        
        <div class="flex items-end gap-4 mb-8">
          <span class="text-[120px] font-black text-red-500 leading-none drop-shadow-lg">
            {{ erros }}
          </span>
          <span class="text-4xl text-red-400/80 font-bold mb-4 uppercase tracking-widest">
            Erros
          </span>
        </div>

        <!-- Palpites do Dia -->
        <div v-if="palpitesComResultados.length > 0" class="w-full max-w-4xl mt-12 space-y-4">
          <div class="text-3xl font-bold text-slate-400 text-center mb-6 uppercase tracking-widest">Palpites do Dia</div>
          <div class="grid gap-6" :class="palpitesComResultados.length > 2 ? 'grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'">
            <div 
              v-for="item in palpitesComResultados" 
              :key="item.jogo.id"
              class="flex flex-col bg-white/5 backdrop-blur-md rounded-3xl p-6 border"
              :class="{
                'border-copa-gold/50 bg-copa-gold/10': item.color === 'dourado',
                'border-copa-green/50 bg-copa-green/10': item.color === 'verde',
                'border-red-500/50 bg-red-500/10': item.color === 'vermelho'
              }"
            >
              <div class="flex items-center justify-between gap-4">
                <!-- Mandante -->
                <div class="flex flex-col items-center flex-1 gap-3">
                  <img :src="getFlagUrl(item.jogo.mandante)" class="w-20 h-14 object-cover rounded-md shadow-lg" :alt="item.jogo.mandante" crossorigin="anonymous" />
                  <span class="text-white text-lg font-bold text-center leading-tight">{{ item.jogo.mandante }}</span>
                </div>
                
                <!-- Placar do Palpite -->
                <div class="flex items-center gap-4 px-6 py-4 rounded-2xl bg-slate-900/50 shadow-inner">
                  <span class="text-5xl font-black" :class="{
                    'text-copa-gold': item.color === 'dourado',
                    'text-copa-green': item.color === 'verde',
                    'text-red-400': item.color === 'vermelho'
                  }">{{ item.palpite?.gols_mandante ?? '-' }}</span>
                  <span class="text-slate-500 text-2xl font-black">×</span>
                  <span class="text-5xl font-black" :class="{
                    'text-copa-gold': item.color === 'dourado',
                    'text-copa-green': item.color === 'verde',
                    'text-red-400': item.color === 'vermelho'
                  }">{{ item.palpite?.gols_visitante ?? '-' }}</span>
                </div>

                <!-- Visitante -->
                <div class="flex flex-col items-center flex-1 gap-3">
                  <img :src="getFlagUrl(item.jogo.visitante)" class="w-20 h-14 object-cover rounded-md shadow-lg" :alt="item.jogo.visitante" crossorigin="anonymous" />
                  <span class="text-white text-lg font-bold text-center leading-tight">{{ item.jogo.visitante }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative z-10 flex flex-col items-center mb-20 text-center">
        <div class="text-3xl font-bold text-white mb-4 tracking-widest">
          BOLÃO DOS GURIS 2026
        </div>
        <p class="text-2xl text-slate-400 font-medium">
          Entre na disputa! Acesse agora.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import jogosData from '@/data/jogos.json'
import { getFlagUrl } from '@/utils/flags'
import { PhBone } from '@phosphor-icons/vue'

const cardRef = ref(null)
const palpitesComResultados = ref([])

const props = defineProps({
  player: {
    type: Object,
    required: true,
    default: () => ({})
  },
  date: {
    type: String,
    required: true
  }
})

const erros = computed(() => {
  if (!props.player) return 0
  return (props.player.jogos_computados || 0) - (props.player.acertos_vencedor || 0)
})

const loadData = async () => {
  if (!props.player?.usuario_id || !props.date) return

  // Encontrar os jogos do dia
  const gamesOfDay = jogosData.filter(j => j.data.startsWith(props.date))
  const gameIds = gamesOfDay.map(j => j.id)

  if (gameIds.length === 0) return

  // Buscar resultados desses jogos
  const { data: resultados } = await supabase
    .from('resultados')
    .select('*')
    .in('jogo_id', gameIds)
  
  // Buscar palpites do usuário para esses jogos
  const { data: palpites } = await supabase
    .from('palpites')
    .select('*')
    .eq('usuario_id', props.player.usuario_id)
    .in('jogo_id', gameIds)

  const resMap = {}
  resultados?.forEach(r => resMap[r.jogo_id] = r)
  
  const palMap = {}
  palpites?.forEach(p => palMap[p.jogo_id] = p)

  const combined = gamesOfDay.map(jogo => {
    const palpite = palMap[jogo.id]
    const resultado = resMap[jogo.id]
    
    let color = 'vermelho' // Errou
    
    if (palpite && resultado && resultado.finalizado) {
      const pm = palpite.gols_mandante
      const pv = palpite.gols_visitante
      const rm = resultado.gols_mandante
      const rv = resultado.gols_visitante
      
      if (pm === rm && pv === rv) {
        color = 'dourado' // 100%
      } else if (Math.sign(pm - pv) === Math.sign(rm - rv)) {
        color = 'verde' // Acertou vencedor/empate
      }
    }
    
    return {
      jogo,
      palpite,
      resultado,
      color
    }
  })

  palpitesComResultados.value = combined
}

defineExpose({
  cardRef,
  loadData
})

const formattedDate = computed(() => {
  if (!props.date) return ''
  const [y, m, d] = props.date.split('-')
  return `${d}/${m}/${y}`
})
</script>
