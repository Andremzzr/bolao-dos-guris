<template>
  <div class="fixed inset-0 z-50 bg-slate-950 flex flex-col h-[100dvh] text-white font-sans overflow-hidden">
    
    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex flex-col items-center justify-center bg-slate-900">
      <svg class="animate-spin h-10 w-10 text-pink-500 mb-4" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p class="font-bold text-slate-300 animate-pulse">Preparando seu Wrapped...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
      <div class="text-6xl mb-4">😢</div>
      <h2 class="text-xl font-bold mb-2">Ops, algo deu errado.</h2>
      <p class="text-slate-400 mb-6">{{ error }}</p>
      <button @click="router.push('/ranking')" class="bg-pink-600 px-6 py-2 rounded-full font-bold">Voltar</button>
    </div>

    <!-- Wrapped Content -->
    <div v-else class="relative w-full h-full flex flex-col">
      
      <!-- Top Action Bar (Close & Progress) -->
      <div class="absolute top-0 w-full z-20 px-2 py-4 flex flex-col gap-3">
        <!-- Progress Bars -->
        <div class="flex gap-1 w-full">
          <div 
            v-for="n in totalStories" 
            :key="n" 
            class="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div 
              class="h-full bg-white origin-left"
              :class="{'transition-all duration-100 ease-linear': n - 1 === currentStory}"
              :style="{ width: getProgressWidth(n - 1) }"
            ></div>
          </div>
        </div>
        
        <!-- Close Button -->
        <div class="flex justify-end pr-2">
          <button @click="router.push('/ranking')" class="text-white/70 hover:text-white p-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>
      
      <!-- Screens -->
      <div class="relative flex-1 flex items-center justify-center cursor-pointer min-h-0 overflow-hidden" @click="handleScreenClick" @touchstart="handleTouchStart" @touchend="handleTouchEnd" @mousedown="pauseAutoAdvance" @mouseup="resumeAutoAdvance" @mouseleave="resumeAutoAdvance">
        <transition name="fade" mode="out-in">
          
          <!-- TELA 1: Intro -->
          <div v-if="currentStory === 0" key="story0" class="w-full h-full flex flex-col items-center justify-center bg-[#1DB954] p-6 text-center">
            <h1 class="text-3xl font-black text-black mb-6 leading-tight">
              Chegamos ao fim do Bolão dos Guris!
            </h1>
            <p class="text-lg font-medium text-black mb-12">
              Vamos ver como foi sua trajetória até aqui...
            </p>
          </div>
          <!-- TELA 2: Stats -->
          <div v-else-if="currentStory === 1" key="story1" class="w-full h-full flex flex-col items-center justify-center bg-[#4B3B8C] p-6 text-center">
            <h2 class="text-2xl font-black text-white mb-6 flex items-center justify-center gap-2">
              Você foi um apostador raiz! <PhTarget :size="28" weight="fill" class="text-fuchsia-400" />
            </h2>
            
            <div class="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
              <div class="bg-black/20 rounded-2xl p-4 flex flex-col items-center">
                <PhChartBar :size="32" weight="duotone" class="mb-2 text-white" />
                <span class="text-3xl font-black text-white">{{ wrappedData.stats.totalPalpites }}</span>
                <span class="text-[10px] text-fuchsia-200 uppercase font-bold tracking-wider mt-1">Palpites Totais</span>
              </div>
              <div class="bg-black/20 rounded-2xl p-4 flex flex-col items-center">
                <PhCheckCircle :size="32" weight="fill" class="mb-2 text-emerald-400" />
                <span class="text-3xl font-black text-emerald-400">{{ wrappedData.stats.totalAcertos }}</span>
                <span class="text-[10px] text-fuchsia-200 uppercase font-bold tracking-wider mt-1">Acertos</span>
              </div>
              <div class="bg-black/20 rounded-2xl p-4 flex flex-col items-center">
                <PhXCircle :size="32" weight="fill" class="mb-2 text-red-400" />
                <span class="text-3xl font-black text-red-400">{{ wrappedData.stats.totalErros }}</span>
                <span class="text-[10px] text-fuchsia-200 uppercase font-bold tracking-wider mt-1">Erros</span>
              </div>
              <div class="bg-black/20 rounded-2xl p-4 flex flex-col items-center">
                <PhFire :size="32" weight="fill" class="mb-2 text-orange-400" />
                <span class="text-3xl font-black text-orange-400">{{ wrappedData.stats.maxAcertosStreak }}</span>
                <span class="text-[10px] text-fuchsia-200 uppercase font-bold tracking-wider mt-1 line-clamp-1">Maior Streak</span>
                <span class="text-[9px] text-orange-300 font-bold">(Acertos)</span>
              </div>
            </div>

            <div v-if="wrappedData.stats.maxErrosStreak > 3" class="mt-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-500/30 flex items-center gap-2">
              <span class="text-sm font-medium text-red-200">Eita... seu maior streak de erros foi <span class="font-bold text-white">{{ wrappedData.stats.maxErrosStreak }}</span></span>
              <PhSnowflake :size="20" weight="fill" class="text-blue-200" />
            </div>
            <div v-else class="mt-2 bg-emerald-500/20 px-4 py-2 rounded-full border border-emerald-500/30 flex items-center gap-2">
              <span class="text-sm font-medium text-emerald-200">Mandou bem! Maior streak de erros: <span class="font-bold text-white">{{ wrappedData.stats.maxErrosStreak }}</span></span>
              <PhSmiley :size="20" weight="fill" class="text-yellow-400" />
            </div>
          </div>
          
          <!-- TELA 3: Zebras que te pegaram (Opção A) -->
          <div v-else-if="currentStory === 2" key="story2" class="w-full h-full flex flex-col items-center justify-center bg-[#121212] p-6 text-center">
            <h2 class="text-2xl font-black text-white mb-4">
              Às vezes nos deparamos com algumas <span class="text-emerald-400">zebras</span> no caminho...
            </h2>
            
            <div v-if="wrappedData.zebrasPerdidas.length > 0" class="mt-8 p-6 bg-[#282828] rounded-3xl w-full max-w-sm">
              <p class="text-sm text-slate-300 mb-2">Você foi com a maioria e apostou no favorito...</p>
              
              <div v-for="(zebra, index) in wrappedData.zebrasPerdidas" :key="index" class="flex justify-between items-center my-3 gap-2">
                <div class="flex flex-col items-center gap-1 flex-1">
                  <img v-if="getFlagUrl(zebra.jogo.mandante)" :src="getFlagUrl(zebra.jogo.mandante)" class="w-8 h-8 rounded-full object-cover border-2 border-slate-700" />
                  <span class="text-xs font-bold leading-tight">{{ zebra.jogo.mandante }}</span>
                </div>
                <span class="text-xs font-black bg-slate-800 px-2 py-1 rounded-full text-slate-400 shrink-0">{{ zebra.resultado.gols_mandante }} x {{ zebra.resultado.gols_visitante }}</span>
                <div class="flex flex-col items-center gap-1 flex-1">
                  <img v-if="getFlagUrl(zebra.jogo.visitante)" :src="getFlagUrl(zebra.jogo.visitante)" class="w-8 h-8 rounded-full object-cover border-2 border-slate-700" />
                  <span class="text-xs font-bold leading-tight">{{ zebra.jogo.visitante }}</span>
                </div>
              </div>

              <p class="text-xs text-slate-300 mt-4">Mas o inesperado aconteceu e te tirou pontos! <br>A maior zebra derrubou <span class="text-emerald-400 font-bold">{{ wrappedData.zebrasPerdidas[0].percentage }}%</span> da galera.</p>
              <div class="text-5xl mt-2">🦓</div>
            </div>
            
            <div v-else class="mt-8 p-6 bg-[#282828] rounded-3xl w-full max-w-sm">
              <p class="text-lg font-bold text-white mb-2">Incrível!</p>
              <p class="text-sm text-slate-300">Você conseguiu fugir das grandes zebras e não perdeu pontos bobos quando o favorito tropeçou.</p>
              <div class="text-6xl mt-4">😎</div>
            </div>
          </div>
          
          <!-- TELA 4: Jogador Favorito (MVP) -->
          <div v-else-if="currentStory === 3" key="story3" class="w-full h-full flex flex-col items-center justify-center bg-[#8C1932] p-6 text-center">
            <h2 class="text-2xl font-black text-white mb-4">
              Todos nós temos um jogador favorito...
            </h2>
            <p class="text-lg text-white/80 mb-12">Ele nos inspira muita confiança!</p>
            
            <div v-if="!revealedMvp" class="relative group cursor-pointer" @click.stop="revealMvp" style="z-index: 50;">
              <!-- Pulse effect around button -->
              <div class="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
              <button class="relative bg-white text-black font-bold text-xl px-8 py-4 rounded-full shadow-2xl z-10">
                Clique para revelar
              </button>
            </div>
            
            <div v-else class="animate-scale-up flex flex-col items-center">
              <div v-if="wrappedData.favoriteMvp?.picture" class="w-32 h-32 rounded-full overflow-hidden border-4 border-yellow-400 shadow-[0_0_20px_rgba(253,224,71,0.5)] mb-4 bg-slate-800">
                <img :src="wrappedData.favoriteMvp.picture" class="w-full h-full object-cover object-top scale-[1.3] origin-top" />
              </div>
              <div v-else class="text-7xl mb-4">🌟</div>
              <h3 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-sm mb-2">
                {{ wrappedData.favoriteMvp?.name || 'Vários craques!' }}
              </h3>
              <p v-if="wrappedData.favoriteMvp" class="text-lg text-purple-200">
                Você apostou nele <span class="font-bold text-white">{{ wrappedData.favoriteMvp.count }}</span> vezes como MVP.
              </p>
              <p v-else class="text-lg text-purple-200">Você diversificou bastante seus craques!</p>
            </div>
          </div>
          
          <!-- TELA 5: Seleções Favoritas -->
          <div v-else-if="currentStory === 4" key="story4" class="w-full h-full flex flex-col items-center justify-center bg-[#056952] p-6 text-center">
            <h2 class="text-2xl font-black text-white mb-4 leading-tight">
              Algumas seleções nos fazem querer viajar pelo mundo...
            </h2>
            <p class="text-md text-white/80 mb-12">E você, meu amigo, parece gostar muito desses países!</p>
            
            <div v-if="!revealedTeams" class="relative group cursor-pointer" @click.stop="revealTeams" style="z-index: 50;">
              <div class="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
              <button class="relative bg-white text-black font-bold text-xl px-8 py-4 rounded-full shadow-2xl z-10">
                Revelar Seleções
              </button>
            </div>
            
            <div v-else class="w-full max-w-sm space-y-4">
              <div v-for="(team, idx) in wrappedData.favoriteTeams" :key="idx" 
                   class="flex items-center justify-between bg-black/20 px-6 py-4 rounded-2xl animate-slide-up"
                   :style="{ animationDelay: `${idx * 200}ms` }">
                <div class="flex items-center gap-3">
                  <span class="text-2xl font-black text-white">#{{ idx + 1 }}</span>
                  <img v-if="getFlagUrl(team.name)" :src="getFlagUrl(team.name)" class="w-8 h-8 rounded-full object-cover shadow-sm" />
                  <span class="text-xl font-bold text-white">{{ team.name }}</span>
                </div>
                <span class="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">{{ team.count }} vitórias</span>
              </div>
              <div v-if="wrappedData.favoriteTeams.length === 0" class="text-lg text-emerald-100">
                Parece que você não teve uma seleção favorita absoluta.
              </div>
            </div>
          </div>
          
          <!-- TELA 6: Zebra Vencida -->
          <div v-else-if="currentStory === 5" key="story5" class="w-full h-full flex flex-col items-center justify-center bg-[#006450] p-6 text-center">
            <div class="mb-8 italic text-white/70 text-lg font-serif">
              "O mar não é um obstáculo: é um caminho."
              <div class="text-sm text-white/50 mt-2">- Amyr Klink</div>
            </div>
            
            <h2 class="text-xl font-bold text-white mb-6">
              Você lutou contra a maré e apostou na <span class="text-yellow-400">zebra</span> (e ganhou!)
            </h2>
            
            <div v-if="wrappedData.zebraVencida" class="mt-4 p-6 bg-black/20 rounded-3xl w-full max-w-sm">
              
              <div class="flex justify-between items-center my-4 gap-2">
                <div class="flex flex-col items-center gap-2 flex-1">
                  <img v-if="getFlagUrl(wrappedData.zebraVencida.jogo.mandante)" :src="getFlagUrl(wrappedData.zebraVencida.jogo.mandante)" class="w-10 h-10 rounded-full object-cover border-2 border-cyan-400/50" />
                  <span class="text-lg font-bold leading-tight">{{ wrappedData.zebraVencida.jogo.mandante }}</span>
                </div>
                <div class="flex flex-col items-center justify-center min-w-[70px]">
                  <div class="flex flex-col items-center bg-blue-900/50 rounded-lg px-2 py-1 border border-cyan-500/30 w-full mb-1">
                    <span class="text-[9px] text-cyan-400 uppercase font-bold">Real</span>
                    <span class="text-xs font-black text-white">{{ wrappedData.zebraVencida.resultado.gols_mandante }} x {{ wrappedData.zebraVencida.resultado.gols_visitante }}</span>
                  </div>
                  <div class="flex flex-col items-center bg-yellow-900/30 rounded-lg px-2 py-1 border border-yellow-500/30 w-full mb-1">
                    <span class="text-[9px] text-yellow-500 uppercase font-bold">Palpite</span>
                    <span class="text-xs font-black text-yellow-300">{{ wrappedData.zebraVencida.palpite.gols_mandante }} x {{ wrappedData.zebraVencida.palpite.gols_visitante }}</span>
                  </div>
                  <span class="text-[9px] text-cyan-200 mt-1 font-bold">{{ wrappedData.zebraVencida.percentage }}% do bolão</span>
                </div>
                <div class="flex flex-col items-center gap-2 flex-1">
                  <img v-if="getFlagUrl(wrappedData.zebraVencida.jogo.visitante)" :src="getFlagUrl(wrappedData.zebraVencida.jogo.visitante)" class="w-10 h-10 rounded-full object-cover border-2 border-cyan-400/50" />
                  <span class="text-lg font-bold leading-tight">{{ wrappedData.zebraVencida.jogo.visitante }}</span>
                </div>
              </div>

              <p class="text-sm text-cyan-100 mt-4 leading-relaxed">
                Você apostou nesse azarão e faturou <span class="font-bold text-white">{{ wrappedData.zebraVencida.palpite.pontuacao }} pts</span>!
              </p>
              <div class="text-6xl mt-4 animate-bounce">🏄‍♂️</div>
            </div>
            
            <div v-else class="mt-4 p-6 bg-black/20 rounded-3xl w-full max-w-sm">
              <p class="text-sm text-cyan-100">Você seguiu a correnteza em suas vitórias e pontuou com a maioria.</p>
              <div class="text-6xl mt-6">⛵</div>
            </div>
          </div>
          
          <!-- TELA 7: Irmãos de Bolão -->
          <div v-else-if="currentStory === 6" key="story6" class="w-full h-full flex flex-col items-center justify-center bg-[#C3F0C8] p-6 text-center">
            <h2 class="text-2xl font-black text-[#121212] mb-2 leading-tight">
              Irmãos de Bolão 🤝
            </h2>
            <p class="text-md text-[#121212]/80 mb-8">Essas foram as pessoas que mais pensaram igual a você!</p>
            
            <div v-if="wrappedData.irmaosDeBolao.length > 0" class="w-full max-w-sm space-y-4">
              <div v-for="(irmao, idx) in wrappedData.irmaosDeBolao" :key="idx" 
                   class="flex items-center justify-between bg-black/5 px-6 py-4 rounded-2xl">
                <div class="flex items-center gap-4">
                  <span class="text-2xl font-black text-[#006450]">#{{ idx + 1 }}</span>
                  <div class="w-10 h-10 rounded-full overflow-hidden bg-slate-800">
                    <img v-if="irmao.avatar" :src="irmao.avatar" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-lg font-bold">{{ (irmao.nome || '?').charAt(0).toUpperCase() }}</div>
                  </div>
                  <span class="text-lg font-bold text-[#121212]">{{ (irmao.nome || 'Usuário').split(' ')[0] }}</span>
                </div>
                <span class="text-xs font-bold bg-black/10 text-black px-3 py-1 rounded-full">{{ irmao.count }} iguais</span>
              </div>
            </div>
            <div v-else class="text-lg text-[#121212]">
              Você foi um lobo solitário, ninguém teve palpites iguais!
            </div>
          </div>
          
          <!-- TELA 8: Resumo Geral -->
          <div v-else-if="currentStory === 7" key="story7" class="w-full h-full overflow-y-auto block bg-black">
            <div class="flex flex-col items-center justify-start min-h-full w-full pt-20 pb-24 px-6 text-center">
              <div ref="summaryCardRef" class="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden" :style="{ backgroundColor: exportBgColor }">
                <div class="absolute -top-10 -right-10 text-9xl opacity-10">🏆</div>
                
                <h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6">
                  Bolão Wrapped 2026
                </h2>
                
                <div class="flex flex-col items-center mb-6">
                  <div class="w-24 h-24 rounded-full border-4 border-pink-500 overflow-hidden mb-3">
                    <img v-if="wrappedData.summary.avatar" :src="wrappedData.summary.avatar" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full bg-slate-800 flex items-center justify-center text-3xl font-bold">
                      {{ (wrappedData.summary.nome || '?').charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  <h3 class="text-xl font-bold text-white">{{ wrappedData.summary.nome || 'Usuário' }}</h3>
                </div>
                
                <div class="grid grid-cols-2 gap-3 text-left mb-4">
                  <div class="bg-white/10 p-2 rounded-xl border border-white/5">
                    <div class="text-[10px] text-pink-300 uppercase font-bold tracking-wider mb-1">Posição</div>
                    <div class="text-xl font-black text-white">#{{ wrappedData.summary.posicao }}</div>
                  </div>
                  <div class="bg-white/10 p-2 rounded-xl border border-white/5">
                    <div class="text-[10px] text-pink-300 uppercase font-bold tracking-wider mb-1">Pontos</div>
                    <div class="text-xl font-black text-white">{{ wrappedData.summary.pontos }}</div>
                  </div>
                  <div class="bg-white/10 p-2 rounded-xl border border-white/5">
                    <div class="text-[10px] text-pink-300 uppercase font-bold tracking-wider mb-1">Palpites</div>
                    <div class="text-xl font-black text-white">{{ wrappedData.summary.total_palpites }}</div>
                  </div>
                  <div class="bg-white/10 p-2 rounded-xl border border-white/5">
                    <div class="text-[10px] text-pink-300 uppercase font-bold tracking-wider mb-1">Cravadas</div>
                    <div class="text-xl font-black text-white">{{ wrappedData.summary.acertos_exatos }}</div>
                  </div>
                </div>

                <!-- MVP and Favorite Team -->
                <div class="flex gap-3 mb-2">
                  <div v-if="wrappedData.favoriteMvp" class="flex-1 bg-white/10 rounded-xl border border-white/5 p-2 flex flex-col items-center text-center">
                    <div class="text-[9px] text-pink-300 uppercase font-bold tracking-wider mb-1">Jogador Favorito</div>
                    <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-400 mb-1 bg-slate-800 flex items-center justify-center">
                      <img v-if="wrappedData.favoriteMvp.picture" :src="wrappedData.favoriteMvp.picture" class="w-full h-full object-cover object-top scale-[1.3] origin-top" />
                      <span v-else class="text-xl mt-1">🌟</span>
                    </div>
                    <div class="text-[10px] font-bold text-white leading-tight line-clamp-1">{{ wrappedData.favoriteMvp.name }}</div>
                  </div>

                  <div v-if="wrappedData.favoriteTeams && wrappedData.favoriteTeams.length > 0" class="flex-1 bg-white/10 rounded-xl border border-white/5 p-2 flex flex-col items-center text-center">
                    <div class="text-[9px] text-pink-300 uppercase font-bold tracking-wider mb-1">Seleção Favorita</div>
                    <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-400 mb-1 bg-slate-800 flex items-center justify-center">
                      <img v-if="getFlagUrl(wrappedData.favoriteTeams[0].name)" :src="getFlagUrl(wrappedData.favoriteTeams[0].name)" class="w-full h-full object-cover" />
                      <span v-else class="text-xl mt-1">🌍</span>
                    </div>
                    <div class="text-[10px] font-bold text-white leading-tight line-clamp-1">{{ wrappedData.favoriteTeams[0].name }}</div>
                  </div>
                </div>
                
                <div class="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400">
                  Obrigado por participar do Bolão dos Guris!
                </div>
              </div>
              
              <div class="flex flex-col items-center gap-2 mt-4 z-50">
                <span class="text-xs text-white/70 font-bold uppercase tracking-wider">Escolha uma cor de fundo</span>
                <div class="flex gap-2">
                  <button v-for="color in bgColors" :key="color" @click.stop="exportBgColor = color" 
                          :class="['w-8 h-8 rounded-full border-2 transition-all shadow-md shrink-0', exportBgColor === color ? 'border-white scale-110' : 'border-transparent']"
                          :style="{ backgroundColor: color }"></button>
                </div>
              </div>

              <div class="mt-4 flex gap-4 w-full max-w-sm justify-center pb-4" style="z-index: 50;">
                <button @click.stop="exportImage" class="flex-1 flex justify-center items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold py-3 px-2 rounded-full transition-all text-sm" :disabled="isExporting">
                  <span v-if="isExporting">Exportando...</span>
                  <span v-else>📸 Compartilhar</span>
                </button>
                <button @click.stop="router.push('/ranking')" class="flex-1 bg-[#282828] hover:bg-[#333] transition-colors text-white font-bold py-3 px-2 rounded-full text-sm">
                  Sair
                </button>
              </div>
            </div>
          </div>
          
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWrapped } from '@/composables/useWrapped'
import { getFlagUrl } from '@/utils/flags'
import { toPng } from 'html-to-image'
import { PhTarget, PhChartBar, PhCheckCircle, PhXCircle, PhFire, PhSnowflake, PhSmiley } from '@phosphor-icons/vue'

const router = useRouter()
const { wrappedData, loading, error, fetchWrappedData } = useWrapped()

const currentStory = ref(0)
const totalStories = 8
const storyDuration = 6000 // 6 seconds per story
const progressMs = ref(0)
let timer = null
let interval = null

const revealedMvp = ref(false)
const revealedTeams = ref(false)

const summaryCardRef = ref(null)
const isExporting = ref(false)
const exportBgColor = ref('#181818')
const bgColors = ['#181818', '#1DB954', '#4B3B8C', '#8C1932', '#056952']

const exportImage = async (e) => {
  if (e) e.stopPropagation()
  if (!summaryCardRef.value) return
  
  isExporting.value = true
  try {
    // No iOS/Safari, a primeira renderização com imagens externas (via Supabase ou Google) 
    // costuma falhar ou vir com imagens em branco. O "double call trick" resolve isso!
    await toPng(summaryCardRef.value, { 
      useCORS: true, 
      cacheBust: true,
      pixelRatio: 1
    })

    const dataUrl = await toPng(summaryCardRef.value, {
      quality: 0.95,
      pixelRatio: 2,
      useCORS: true,
      cacheBust: true
    })
    
    const link = document.createElement('a')
    link.download = 'meu-bolao-wrapped.png'
    link.href = dataUrl
    link.click()
  } catch (err) {
    console.error('Erro ao exportar imagem', err)
    alert('Não foi possível exportar a imagem. Tente novamente.')
  } finally {
    isExporting.value = false
  }
}

// For touch hold to pause
const isPaused = ref(false)

const getProgressWidth = (index) => {
  if (index < currentStory.value) return '100%'
  if (index > currentStory.value) return '0%'
  return `${(progressMs.value / storyDuration) * 100}%`
}

const handleScreenClick = (e) => {
  const width = window.innerWidth
  if (e.clientX < width / 3) {
    prevStory()
  } else {
    nextStory()
  }
}

const nextStory = () => {
  // Se está numa tela com revelação pendente, o click não avança, ele revela
  if (currentStory.value === 3 && !revealedMvp.value) return
  if (currentStory.value === 4 && !revealedTeams.value) return

  if (currentStory.value < totalStories - 1) {
    currentStory.value++
    resetProgress()
  }
}

const prevStory = () => {
  if (currentStory.value > 0) {
    currentStory.value--
    resetProgress()
    // Reset reveals if going back
    if (currentStory.value === 3) revealedMvp.value = false
    if (currentStory.value === 4) revealedTeams.value = false
  }
}

const revealMvp = (e) => {
  e.stopPropagation() // Prevent advancing story
  revealedMvp.value = true
}

const revealTeams = (e) => {
  e.stopPropagation() // Prevent advancing story
  revealedTeams.value = true
}

const startAutoAdvance = () => {
  if (interval) clearInterval(interval)
  
  interval = setInterval(() => {
    if (isPaused.value || loading.value || error.value) return
    
    // Pause auto-advance if on a screen waiting for interaction
    if (currentStory.value === 3 && !revealedMvp.value) return
    if (currentStory.value === 4 && !revealedTeams.value) return

    progressMs.value += 100 // update every 100ms
    
    if (progressMs.value >= storyDuration) {
      if (currentStory.value < totalStories - 1) {
        currentStory.value++
        resetProgress()
      } else {
        progressMs.value = storyDuration // freeze at 100% on last screen
        clearInterval(interval)
      }
    }
  }, 100)
}

const resetProgress = () => {
  progressMs.value = 0
}

const pauseAutoAdvance = () => {
  isPaused.value = true
}

const resumeAutoAdvance = () => {
  isPaused.value = false
}

const handleTouchStart = () => {
  pauseAutoAdvance()
}

const handleTouchEnd = () => {
  resumeAutoAdvance()
}

onMounted(async () => {
  await fetchWrappedData()
  if (!error.value) {
    startAutoAdvance()
  }
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.animate-scale-up {
  animation: scaleUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes scaleUp {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.animate-slide-up {
  opacity: 0;
  animation: slideUp 0.5s ease-out forwards;
}

@keyframes slideUp {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.bg-dashed-road {
  background-image: linear-gradient(to bottom, transparent 50%, #fff 50%);
  background-size: 100% 40px;
}

.animate-road {
  animation: roadMove 0.5s linear infinite;
}

@keyframes roadMove {
  0% { background-position: 0 0; }
  100% { background-position: 0 40px; }
}

.animate-bounce-slight {
  animation: bounceSlight 0.5s ease-in-out infinite alternate;
}

@keyframes bounceSlight {
  0% { transform: translate(-50%, 0); }
  100% { transform: translate(-50%, -4px); }
}
</style>
