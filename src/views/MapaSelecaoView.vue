<template>
  <div class="pb-20 min-h-screen relative flex flex-col bg-slate-900">
    <!-- Header -->
    <header class="shrink-0 z-[1000] glass border-b border-copa-border relative">
      <div class="px-4 py-3 flex gap-2 items-center">
        <PhMapPinLine :size="28" class="text-copa-accent" />
        <h1 class="text-lg font-bold text-white">Jornada da Seleção</h1>
      </div>
    </header>

    <!-- Controls Overlay -->
    <div class="absolute top-20 left-4 right-4 z-[1000] flex justify-center pointer-events-none">
      <div class="glass p-4 rounded-2xl shadow-xl w-full max-w-md pointer-events-auto relative">
        <label class="text-sm font-semibold text-slate-300 block mb-2">Selecione uma Seleção:</label>
        
        <div class="relative">
          <div v-if="isDropdownOpen" class="fixed inset-0 z-10" @click="onClickOutside"></div>

          <div class="relative z-20">
            <input 
              type="text"
              v-model="searchQuery"
              @focus="isDropdownOpen = true"
              placeholder="Digite para buscar..."
              class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-copa-accent placeholder-slate-400 shadow-inner"
            />
            <div class="absolute inset-y-0 right-4 flex items-center">
              <button 
                v-if="searchQuery" 
                @click="clearSearch" 
                class="text-slate-400 hover:text-white p-1"
                type="button"
              >
                <PhX :size="16" weight="bold" />
              </button>
            </div>

            <ul 
              v-if="isDropdownOpen"
              class="absolute left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-none"
            >
              <li 
                v-for="team in filteredSelecoes" 
                :key="team"
                @click="selectTeam(team)"
                class="px-4 py-3 cursor-pointer hover:bg-slate-700 flex items-center gap-3 transition-colors text-white border-b border-slate-700/50 last:border-0"
              >
                <img v-if="getFlagUrl(team)" :src="getFlagUrl(team)" class="w-8 h-6 object-cover rounded shadow" />
                <span v-else class="w-8 h-6 flex items-center justify-center text-xs">🏴</span>
                <span>{{ team }}</span>
              </li>
              <li v-if="filteredSelecoes.length === 0" class="px-4 py-3 text-slate-400 text-center text-sm">
                Nenhuma seleção encontrada.
              </li>
            </ul>
          </div>
        </div>

        <div v-if="selectedTeam" class="flex items-center gap-4 mt-4 justify-between bg-white/5 p-3 rounded-xl border border-white/10">
          <div class="flex items-center gap-3">
            <img v-if="getFlagUrl(selectedTeam)" :src="getFlagUrl(selectedTeam)" class="w-12 h-9 object-cover rounded shadow ring-1 ring-white/20" />
            <span class="font-bold text-xl text-white">{{ selectedTeam }}</span>
          </div>
          <button 
            @click="playAnimation" 
            :disabled="!matchesData.length || isAnimating"
            class="bg-copa-accent hover:bg-emerald-400 text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhAirplane :size="20" weight="fill" :class="{ 'animate-pulse': isAnimating }" />
            {{ isAnimating ? 'Voando...' : 'Animar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div id="mapContainer" class="flex-1 w-full h-full min-h-[600px] z-[1]"></div>
    
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useJogos } from '@/composables/useJogos'
import { getFlagUrl } from '@/utils/flags'
import { stadiumCoords } from '@/data/stadiumCoords'
import { PhMapPinLine, PhAirplane, PhX } from '@phosphor-icons/vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const { jogosData } = useJogos()

const selecoes = computed(() => {
  const teams = new Set()
  jogosData.forEach(j => {
    teams.add(j.mandante)
    teams.add(j.visitante)
  })
  return Array.from(teams).filter(s => !s.includes("Jogo")).sort()
})

const selectedTeam = ref('')
const searchQuery = ref('')
const isDropdownOpen = ref(false)
const matchesData = ref([])
const loading = ref(false)
const isAnimating = ref(false)

const filteredSelecoes = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return selecoes.value
  return selecoes.value.filter(team => team.toLowerCase().includes(q))
})

function selectTeam(team) {
  selectedTeam.value = team
  searchQuery.value = team
  isDropdownOpen.value = false
}

function clearSearch() {
  selectedTeam.value = ''
  searchQuery.value = ''
  isDropdownOpen.value = false
  matchesData.value = []
  clearMap()
}

function onClickOutside() {
  isDropdownOpen.value = false
  if (searchQuery.value !== selectedTeam.value) {
    searchQuery.value = selectedTeam.value
  }
}

// Map references
let map = null
let markers = []
let polylines = []
let airplaneMarker = null
let animationFrameId = null

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  if (map) {
    map.remove()
  }
})

function initMap() {
  map = L.map('mapContainer', {
    zoomControl: false,
  }).setView([39.8, -98.5], 4) // Center on North America

  L.control.zoom({
    position: 'bottomright'
  }).addTo(map)

  // Detailed OSM tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)
}

function clearMap() {
  markers.forEach(m => map.removeLayer(m))
  polylines.forEach(p => map.removeLayer(p))
  markers = []
  polylines = []
  if (airplaneMarker) {
    map.removeLayer(airplaneMarker)
    airplaneMarker = null
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  isAnimating.value = false
}

watch(selectedTeam, async (newTeam) => {
  if (!newTeam) return
  
  loading.value = true
  clearMap()
  
  // Find all matches for this team
  let teamMatches = jogosData.filter(j => j.mandante === newTeam || j.visitante === newTeam)
  teamMatches.sort((a, b) => new Date(a.data) - new Date(b.data)) // chronological
  
  const matchIds = teamMatches.map(j => j.id)
  
  if (matchIds.length === 0) {
    loading.value = false
    matchesData.value = []
    return
  }
  
  const { data, error } = await supabase
    .from('resultados')
    .select('jogo_id, gols_mandante, gols_visitante')
    .in('jogo_id', matchIds)
    
  if (error) {
    console.error("Error fetching match stats:", error)
    loading.value = false
    return
  }
  
  const resultsMap = {}
  data?.forEach(r => {
    resultsMap[r.jogo_id] = r
  })
  
  matchesData.value = teamMatches.map(j => {
    const coords = stadiumCoords[j.estadio]
    return {
      jogo: j,
      resultado: resultsMap[j.id] || null,
      coords: coords ? [coords.lat, coords.lon] : null
    }
  }).filter(m => m.coords !== null)
  
  loading.value = false
  
  drawStaticRoute()
})

function drawStaticRoute() {
  if (!matchesData.value.length || !map) return

  const points = matchesData.value.map(m => m.coords)

  // Add dots for each stadium
  matchesData.value.forEach((m, index) => {
    const flagMandante = getFlagUrl(m.jogo.mandante)
    const flagVisitante = getFlagUrl(m.jogo.visitante)
    
    const imgMandante = flagMandante ? `<img src="${flagMandante}" class="inline-block w-8 h-6 object-cover rounded shadow ring-1 ring-black/10" />` : `<span class="text-xl">🏴</span>`
    const imgVisitante = flagVisitante ? `<img src="${flagVisitante}" class="inline-block w-8 h-6 object-cover rounded shadow ring-1 ring-black/10" />` : `<span class="text-xl">🏴</span>`
    
    const resStr = m.resultado 
      ? `<span class="text-xl">${m.resultado.gols_mandante}</span> <span class="text-slate-400 font-normal mx-1 text-sm">x</span> <span class="text-xl">${m.resultado.gols_visitante}</span>` 
      : `<span class="text-xs italic text-slate-400">A jogar</span>`
    
    const popupContent = `
      <div class="text-slate-800 p-1 min-w-[200px]">
        <div class="text-[10px] uppercase font-bold text-slate-500 mb-2 text-center border-b border-slate-200 pb-1">Jogo ${index + 1}</div>
        
        <div class="flex items-center justify-between mb-2 gap-2">
          <div class="flex flex-col items-center gap-1 w-1/3">
            ${imgMandante}
            <span class="text-[10px] font-bold text-center leading-tight truncate w-full" title="${m.jogo.mandante}">${m.jogo.mandante}</span>
          </div>
          
          <div class="font-black bg-slate-100 px-3 py-1.5 rounded-lg shadow-inner whitespace-nowrap text-center flex items-center justify-center">
            ${resStr}
          </div>
          
          <div class="flex flex-col items-center gap-1 w-1/3">
            ${imgVisitante}
            <span class="text-[10px] font-bold text-center leading-tight truncate w-full" title="${m.jogo.visitante}">${m.jogo.visitante}</span>
          </div>
        </div>
        
        <div class="text-[10px] text-slate-500 text-center truncate pt-2 border-t border-slate-200 flex items-center justify-center gap-1 mt-1">
          <svg class="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          ${m.jogo.estadio}
        </div>
      </div>
    `

    const marker = L.circleMarker(m.coords, {
      radius: 6,
      fillColor: '#34d399',
      color: '#020617',
      weight: 2,
      fillOpacity: 1
    }).addTo(map)
      .bindPopup(popupContent, { className: 'custom-popup', autoClose: false, closeOnClick: false })
      
    markers.push(marker)
  })

  // Draw dashed line connecting matches
  for (let i = 0; i < points.length - 1; i++) {
    const line = L.polyline([points[i], points[i+1]], {
      color: '#34d399',
      weight: 3,
      dashArray: '10, 10',
      opacity: 0.7
    }).addTo(map)
    polylines.push(line)
  }

  // Adjust map bounds to fit the route
  map.fitBounds(L.latLngBounds(points), { padding: [50, 50] })
}

function playAnimation() {
  if (!matchesData.value.length || isAnimating.value || !map) return
  isAnimating.value = true

  // Close all popups
  markers.forEach(m => m.closePopup())

  const points = matchesData.value.map(m => m.coords)

  // Setup Airplane Marker
  const planeIcon = L.divIcon({
    html: `<div id="airplane-inner" class="text-3xl transition-transform duration-75 origin-center text-emerald-400 drop-shadow-md" style="transform: rotate(45deg);">✈️</div>`,
    className: 'bg-transparent border-0',
    iconSize: [30, 30],
    iconAnchor: [15, 15] // center
  })

  if (airplaneMarker) {
    map.removeLayer(airplaneMarker)
  }
  airplaneMarker = L.marker(points[0], { icon: planeIcon, zIndexOffset: 1000 }).addTo(map)

  let currentSegment = 0
  let progress = 0
  const speed = 0.003 // Slower animation speed
  const animZoom = Math.max(map.getZoom() + 5, 5) // Increase zoom for animation
  
  function updatePlaneRotation() {
    if (currentSegment >= points.length - 1) return
    const startNode = points[currentSegment]
    const endNode = points[currentSegment + 1]
    const dx = endNode[1] - startNode[1]
    const dy = -(endNode[0] - startNode[0]) 
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    const rotation = angle + 45
    
    const planeEl = document.getElementById('airplane-inner')
    if (planeEl) {
      planeEl.style.transform = `rotate(${rotation}deg)`
    }
  }

  function animate() {
    if (currentSegment >= points.length - 1) {
      // Done
      isAnimating.value = false
      map.setView(points[currentSegment], animZoom, { animate: true })
      markers[currentSegment].openPopup()
      return
    }

    progress += speed

    if (progress >= 1) {
      // Reached next city
      progress = 0
      currentSegment++
      
      // Open popup and wait longer
      map.setView(points[currentSegment], animZoom, { animate: true })
      markers[currentSegment].openPopup()
      
      if (currentSegment >= points.length - 1) {
        isAnimating.value = false
        return
      }
      
      setTimeout(() => {
        markers.forEach(m => m.closePopup())
        updatePlaneRotation()
        animationFrameId = requestAnimationFrame(animate)
      }, 3500)
      return
    }

    // Interpolate position
    const start = points[currentSegment]
    const end = points[currentSegment + 1]
    const lat = start[0] + (end[0] - start[0]) * progress
    const lng = start[1] + (end[1] - start[1]) * progress
    
    airplaneMarker.setLatLng([lat, lng])
    map.setView([lat, lng], animZoom, { animate: false })
    
    animationFrameId = requestAnimationFrame(animate)
  }

  // Start sequence
  updatePlaneRotation()
  map.setView(points[0], animZoom, { animate: true })
  markers[0].openPopup()
  setTimeout(() => {
    markers.forEach(m => m.closePopup())
    animationFrameId = requestAnimationFrame(animate)
  }, 2000)
}
</script>

<style>
/* Leaflet Popup Resets */
:deep(.custom-popup .leaflet-popup-content-wrapper) {
  background: transparent;
  box-shadow: none;
  padding: 0;
  border-radius: 0;
}
:deep(.custom-popup .leaflet-popup-content) {
  margin: 0;
  width: auto !important;
}
:deep(.custom-popup .leaflet-popup-tip-container) {
  display: none;
}
</style>
