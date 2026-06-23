<template>
  <div class="h-[100dvh] pb-20 flex flex-col bg-copa-bg text-slate-100">
    <!-- Header -->
    <header class="shrink-0 z-30 glass border-b border-copa-border">
      <div class="px-4 py-3 flex gap-2 items-center">
        <PhChartBar :size="28" class="text-copa-gold" />
        <h1 class="text-lg font-bold text-white">Estatísticas das Equipes</h1>
      </div>
    </header>

    <!-- Table Selection Buttons (Horizontal Scroll) -->
    <div class="shrink-0 bg-slate-900/40 border-b border-copa-border/40 py-2.5 px-4 overflow-x-auto scrollbar-none flex gap-2">
      <button
        v-for="table in tables"
        :key="table.slideIndex"
        @click="changeTable(table.slideIndex)"
        class="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shrink-0 border tap-scale cursor-pointer"
        :class="[
          activeSlideIndex === table.slideIndex
            ? 'bg-copa-gold text-slate-950 border-copa-gold shadow-lg shadow-copa-gold/25'
            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
        ]"
      >
        {{ table.tableTitle }}
      </button>
    </div>

    <!-- Table Container -->
    <div class="flex-1 overflow-auto min-h-0 bg-copa-bg">
      <div class="inline-block min-w-full align-middle">
        <table class="min-w-full border-separate border-spacing-0">
          <thead>
            <tr class="bg-slate-950 border-b border-copa-border/60 text-left sticky top-0 z-30">
              <!-- Sticky header: Equipa -->
              <th
                @click="sortBy('Equipa')"
                class="sticky left-0 z-40 bg-slate-950 px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider max-w-[50px] cursor-pointer select-none hover:bg-slate-800 hover:text-white transition-colors duration-150 border-r border-copa-border/40 border-b border-copa-border/60"
              >
                <div class="flex items-center gap-1">
                  <span>Equipa</span>
                  <component :is="getSortIcon('Equipa')" :size="12" class="text-copa-gold shrink-0" />
                </div>
              </th>

              <!-- Dynamic column headers -->
              <th
                v-for="col in columns"
                :key="col"
                @click="sortBy(col)"
                class="px-4 py-3 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap text-center cursor-pointer select-none hover:bg-slate-800 hover:text-white transition-colors duration-150 border-b border-copa-border/60"
              >
                <div class="flex items-center justify-center gap-1 mx-auto">
                  <span>{{ col }}</span>
                  <component :is="getSortIcon(col)" :size="12" class="text-copa-gold shrink-0" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-copa-border/20">
            <tr
              v-for="row in sortedData"
              :key="row.Equipa"
              class="group hover:bg-slate-800/40 transition-colors duration-150"
            >
              <!-- Sticky cell: Equipa -->
              <td class="sticky left-0 z-20 bg-copa-bg group-hover:bg-slate-800/60 transition-colors duration-150 px-4 py-3.5 text-sm font-semibold whitespace-nowrap border-r border-copa-border/40 border-b border-copa-border/10">
                <div class="flex items-center gap-2.5">
                  <div class="w-6 h-4 shrink-0 rounded overflow-hidden bg-slate-800 shadow-sm border border-slate-700/50 flex items-center justify-center">
                    <img
                      v-if="getFlagUrl(row.Equipa)"
                      :src="getFlagUrl(row.Equipa)"
                      :alt="row.Equipa"
                      class="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span v-else class="text-[8px] text-slate-500 font-bold">🏴</span>
                  </div>
                  <span class="text-white font-bold tracking-wide">{{ row.Equipa }}</span>
                </div>
              </td>

              <!-- Dynamic Stats Columns -->
              <td
                v-for="col in columns"
                :key="col"
                class="px-4 py-3.5 text-sm text-slate-300 text-center font-mono border-b border-copa-border/10"
              >
                {{ row[col] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { PhChartBar, PhCaretUp, PhCaretDown, PhCaretUpDown } from '@phosphor-icons/vue'
import teamStatsData from '@/../fifa-team-statistics.json'
import { getFlagUrl } from '@/utils/flags'

const tables = ref(teamStatsData)
const activeSlideIndex = ref(0)

// Sorting states
const sortKey = ref('GOLS')
const sortOrder = ref('asc')

const currentTable = computed(() => {
  return tables.value.find(t => t.slideIndex === activeSlideIndex.value) || tables.value[0]
})

const columns = computed(() => {
  if (!currentTable.value || !currentTable.value.data.length) return []
  const firstRow = currentTable.value.data[0]
  // Return all keys except position and team name to render dynamically
  return Object.keys(firstRow).filter(k => k !== 'Posição' && k !== 'Equipa')
})

function changeTable(slideIndex) {
  activeSlideIndex.value = slideIndex
  sortKey.value = slideIndex == 0 ? 'GOLS' : (slideIndex == 1 ? 'PASSES' : 'GOLS CONTRA')
  sortOrder.value = 'asc'
}

function sortBy(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    // Default to descending for numeric stats columns, ascending for team names/position
    sortOrder.value = (key === 'Equipa' || key === 'Posição') ? 'asc' : 'desc'
  }
}

function getSortIcon(key) {
  if (sortKey.value !== key) return PhCaretUpDown
  return sortOrder.value === 'asc' ? PhCaretUp : PhCaretDown
}

// Sort the data dynamically
const sortedData = computed(() => {
  if (!currentTable.value || !currentTable.value.data) return []
  
  const data = [...currentTable.value.data]
  const key = sortKey.value
  const order = sortOrder.value

  return data.sort((a, b) => {
    let valA = a[key]
    let valB = b[key]

    // Helper to parse numbers (remove %, x, s, etc.)
    const parseNum = (val) => {
      if (val === undefined || val === null) return 0
      const clean = val.toString().replace(/[^\d.-]/g, '')
      const num = parseFloat(clean)
      return isNaN(num) ? val : num
    }

    let numA = parseNum(valA)
    let numB = parseNum(valB)

    if (typeof numA === 'number' && typeof numB === 'number') {
      return order === 'asc' ? numA - numB : numB - numA
    } else {
      // String locale fallback (e.g. team name)
      const strA = (valA || '').toString().toLowerCase()
      const strB = (valB || '').toString().toLowerCase()
      return order === 'asc' 
        ? strA.localeCompare(strB, 'pt', { sensitivity: 'base' })
        : strB.localeCompare(strA, 'pt', { sensitivity: 'base' })
    }
  })
})
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-none {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
