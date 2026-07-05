<template>
  <div class="pb-20 min-h-screen">
    <!-- Header -->
    <header class="sticky top-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3">
        <h1 class="text-lg font-bold text-white flex items-center gap-1.5">
          <PhUser :size="20" class="text-white" /> Perfil
        </h1>
      </div>
    </header>

    <div class="px-4 py-6 space-y-4">
      <!-- Profile card -->
      <div class="glass rounded-2xl p-6 text-center">
        <div class="relative w-24 h-24 mx-auto mb-4 group cursor-pointer tap-scale" @click="triggerFileInput">
          <!-- Avatar Image -->
          <img v-if="user?.avatar_url" :src="user.avatar_url" alt="Avatar" class="w-full h-full object-cover rounded-full border-2 border-copa-accent/50 shadow-lg" />
          <!-- Initials Fallback -->
          <div v-else class="w-full h-full rounded-full bg-gradient-to-br from-copa-accent to-copa-accent-light flex items-center justify-center text-4xl font-black text-white shadow-lg">
            {{ userInitial }}
          </div>
          
          <!-- Hover Overlay -->
          <div class="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PhCamera :size="24" class="text-white" />
            <span class="text-[10px] text-white font-semibold mt-1">Alterar</span>
          </div>

          <!-- Loading Spinner -->
          <div v-if="uploadingAvatar" class="absolute inset-0 bg-black/80 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg class="animate-spin h-8 w-8 text-copa-accent" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
        <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileChange" />
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

      <!-- Gráfico de Pontos por Dia de Jogo -->
      <PontosChart />

      <!-- Detailed stats -->
      <div class="glass rounded-xl p-4 space-y-3">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Detalhamento</h3>
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300 flex items-center gap-1.5">
              <PhTarget :size="18" class="text-copa-gold" /> Placares exatos
            </span>
            <span class="text-sm font-bold text-copa-gold">{{ stats.exatos }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300 flex items-center gap-1.5">
              <PhFire :size="18" class="text-orange-500" /> Sequência de acertos
            </span>
            <span class="text-sm font-bold text-orange-500">{{ stats.streak }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300 flex items-center gap-1.5">
              <PhChartBar :size="18" class="text-blue-400" /> Acerto com saldo
            </span>
            <span class="text-sm font-bold text-blue-400">{{ stats.saldo }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300 flex items-center gap-1.5">
              <PhCheckCircle :size="18" class="text-copa-green" /> Acerto do vencedor
            </span>
            <span class="text-sm font-bold text-copa-green">{{ stats.vencedor }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-300 flex items-center gap-1.5">
              <PhClipboardText :size="18" class="text-slate-400" /> Jogos computados
            </span>
            <span class="text-sm font-bold text-slate-300">{{ stats.computados }}</span>
          </div>
        </div>
      </div>

      <!-- Coleção de Cartas -->
      <div class="glass rounded-xl p-4 space-y-4">
        <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
          <PhCards :size="20" class="text-copa-accent" /> Coleção de Cartas
        </h3>
        
        <div v-if="loadingCartas" class="flex justify-center py-4">
          <svg class="animate-spin h-6 w-6 text-copa-accent" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        
        <div v-else-if="minhasCartas.length === 0" class="text-center py-6">
          <p class="text-sm text-slate-400">Você ainda não tem nenhuma carta.</p>
          <p class="text-xs text-slate-500 mt-1">Acerte um placar na mosca para ganhar!</p>
        </div>
        
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div v-for="carta in minhasCartas" :key="carta.id" class="w-full cursor-pointer tap-scale" @click="selectedCarta = carta">
            <CardMagic 
              :title="carta.title"
              :description="carta.description"
              :imageUrl="carta.image_url"
            />
          </div>
        </div>
      </div>

      <!-- Notificações -->
      <button
        v-if="isSupported && !isSubscribed"
        @click="subscribe(user?.id)"
        class="w-full glass border border-copa-accent/30 bg-copa-accent/10 rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-copa-accent-light font-semibold text-sm tap-scale hover:bg-copa-accent/20 transition-colors cursor-pointer"
      >
        <PhBell :size="18" />
        <span>Ativar Notificações de Jogos</span>
      </button>
      <div v-else-if="isSubscribed" class="w-full glass border border-copa-green/30 bg-copa-green/10 rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-copa-green font-semibold text-sm">
        <PhBellRinging :size="18" />
        <span>Notificações Ativadas</span>
      </div>

      <!-- Share link -->
      <button
        @click="compartilhar"
        class="w-full glass rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-copa-green font-semibold text-sm tap-scale hover:bg-copa-green/10 transition-colors cursor-pointer"
      >
        <PhShareNetwork :size="18" />
        <span>Compartilhar no WhatsApp</span>
      </button>

      <!-- Logout -->
      <button
        @click="handleLogout"
        class="w-full glass rounded-xl px-4 py-3.5 flex items-center justify-center gap-2 text-red-400 font-semibold text-sm tap-scale hover:bg-red-500/10 transition-colors cursor-pointer"
      >
        <PhSignOut :size="18" />
        <span>Sair do Bolão</span>
      </button>
    </div>

    <!-- Modal de Carta Expandida -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="selectedCarta" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm" @click="selectedCarta = null">
          <div class="relative w-full max-w-sm mx-auto flex flex-col gap-4" @click.stop>
            <button @click="selectedCarta = null" class="absolute -top-14 right-0 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer">
              <PhX :size="24" />
            </button>
            
            <div ref="cardContainer" class="w-full rounded-2xl overflow-hidden">
              <CardMagic 
                :title="selectedCarta.title"
                :description="selectedCarta.description"
                :imageUrl="selectedCarta.image_url"
                class="shadow-2xl shadow-copa-accent/20"
              />
            </div>

            <button
              @click="exportCartaImage"
              :disabled="isExporting"
              class="w-full glass rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-white font-semibold text-sm tap-scale hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            >
              <PhDownloadSimple v-if="!isExporting" :size="20" />
              <svg v-else class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{{ isExporting ? 'Exportando...' : 'Salvar Imagem' }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRanking } from '@/composables/useRanking'
import { usePush } from '@/composables/usePush'
import { supabase } from '@/lib/supabaseClient'
import PontosChart from '@/components/PontosChart.vue'
import CardMagic from '@/components/CardMagic.vue'
import { PhUser, PhTarget, PhFire, PhChartBar, PhCheckCircle, PhClipboardText, PhShareNetwork, PhSignOut, PhCamera, PhCards, PhX, PhDownloadSimple, PhBell, PhBellRinging } from '@phosphor-icons/vue'
import { toPng } from 'html-to-image'

const { user, logout, updateAvatar } = useAuth()
const { ranking, fetchRanking } = useRanking()
const { isSupported, isSubscribed, checkSubscription, subscribe } = usePush()

const fileInput = ref(null)
const uploadingAvatar = ref(false)

const minhasCartas = ref([])
const loadingCartas = ref(true)
const selectedCarta = ref(null)

const isExporting = ref(false)
const cardContainer = ref(null)

onMounted(async () => {
  if (user.value?.id) {
    fetchCartas()
    checkSubscription()
  }
})

async function fetchCartas() {
  loadingCartas.value = true
  try {
    const { data, error } = await supabase
      .from('usuario_carta')
      .select(`
        adquirida_em,
        cartas (
          id,
          title,
          description,
          image_url,
          jogo_id,
          jogos (
            mandante,
            visitante,
            data
          )
        )
      `)
      .eq('usuario_id', user.value.id)
      
    if (error) throw error
    if (data) {
      const cartasMap = data.map(item => item.cartas).filter(Boolean)
      const jogosIds = cartasMap.map(c => c.jogo_id).filter(Boolean)
      
      let resultadosMap = {}
      if (jogosIds.length > 0) {
        const { data: resData } = await supabase
          .from('resultados')
          .select('jogo_id, gols_mandante, gols_visitante')
          .in('jogo_id', jogosIds)
          
        if (resData) {
          resData.forEach(r => {
            resultadosMap[r.jogo_id] = r
          })
        }
      }

      minhasCartas.value = cartasMap.map(carta => {
        let extraInfo = '';
        if (carta.jogos) {
          const j = carta.jogos;
          const dataFormatada = new Date(j.data).toLocaleDateString('pt-BR');
          const r = resultadosMap[carta.jogo_id] || {};
          
          if (r.gols_mandante !== undefined) {
             extraInfo = `\n\n${j.mandante} ${r.gols_mandante} x ${r.gols_visitante} ${j.visitante}\n${dataFormatada}`;
          } else {
             extraInfo = `\n\n${j.mandante} x ${j.visitante}\n${dataFormatada}`;
          }
        }
        
        return {
          ...carta,
          description: (carta.description || '') + extraInfo
        };
      })
    }
  } catch (err) {
    console.error('Erro ao buscar cartas:', err)
  } finally {
    loadingCartas.value = false
  }
}


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
    streak: myRank?.acertos_seguidos ?? 0,
  }
})

const userInitial = computed(() => {
  return user.value?.nome?.charAt(0)?.toUpperCase() || '?'
})

function triggerFileInput() {
  if (!uploadingAvatar.value) {
    fileInput.value?.click()
  }
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecione uma imagem válida.')
    return
  }

  uploadingAvatar.value = true

  try {
    const compressedBlob = await compressImage(file, 400)
    const fileName = `${user.value.id}-${Date.now()}.jpeg`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, compressedBlob, {
        cacheControl: '3600',
        upsert: false
      })
      
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
    
    await updateAvatar(data.publicUrl)
    
  } catch (err) {
    console.error('Erro ao enviar avatar:', err)
    alert('Falha ao atualizar a foto de perfil. Tente novamente.')
  } finally {
    uploadingAvatar.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function compressImage(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', 0.85)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

function compartilhar() {
  const text = `⚽ Bolão Copa 2026 ⚽\n\n🏆 ${user.value?.nome} está em ${stats.value.posicao} com ${stats.value.pontos} pontos!\n\nEntra no bolão: ${window.location.origin}`
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank')
}

async function exportCartaImage() {
  if (!cardContainer.value) return
  
  isExporting.value = true
  try {
    // Primeira renderização (warm up) para o Safari carregar as fontes e imagens no canvas
    await toPng(cardContainer.value, {
      cacheBust: true,
      skipAutoScale: true,
      filter: (node) => node.tagName !== 'SCRIPT'
    }).catch(() => {})
    
    // Pequeno delay para garantir
    await new Promise(resolve => setTimeout(resolve, 300))

    const dataUrl = await toPng(cardContainer.value, {
      quality: 1,
      pixelRatio: 2,
      cacheBust: true,
      skipAutoScale: true,
      backgroundColor: '#0f172a',
      filter: (node) => node.tagName !== 'SCRIPT'
    })
    
    const link = document.createElement('a')
    link.download = `carta-${selectedCarta.value?.title || 'bolao'}.png`
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Erro ao exportar carta:', err)
    alert('Erro ao exportar a imagem da carta.')
  } finally {
    isExporting.value = false
  }
}

function handleLogout() {
  if (confirm('Tem certeza que quer sair?')) {
    logout()
  }
}
</script>
