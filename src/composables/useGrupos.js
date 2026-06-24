import { computed } from 'vue'
import { useJogos } from '@/composables/useJogos'
import jogosData from '@/data/jogos.json'

// All 12 groups with their teams extracted from jogos.json
const GRUPOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// Only group stage games (grupo !== null)
const jogosGrupo = jogosData.filter(j => j.grupo !== null)

function criarTimeVazio(nome) {
  return {
    nome,
    pj: 0, // Partidas jogadas
    vit: 0, // Vitórias
    e: 0,   // Empates
    der: 0, // Derrotas
    gm: 0,  // Gols marcados
    gc: 0,  // Gols contra
    sg: 0,  // Saldo de gols
    pts: 0, // Pontos
  }
}

/**
 * Builds all teams in a group from the jogos.json fixture list.
 * Returns a map: { teamName: statsObj }
 */
function buildTimes(grupo) {
  const times = {}
  jogosGrupo
    .filter(j => j.grupo === grupo)
    .forEach(j => {
      if (!times[j.mandante]) times[j.mandante] = criarTimeVazio(j.mandante)
      if (!times[j.visitante]) times[j.visitante] = criarTimeVazio(j.visitante)
    })
  return times
}

/**
 * Applies a finished result to the stats map.
 */
function applyResultado(times, mandante, visitante, gm, gc) {
  const m = times[mandante]
  const v = times[visitante]
  if (!m || !v) return

  m.pj += 1; v.pj += 1
  m.gm += gm; m.gc += gc; m.sg += gm - gc
  v.gm += gc; v.gc += gm; v.sg += gc - gm

  if (gm > gc) {
    m.vit += 1; m.pts += 3
    v.der += 1
  } else if (gm < gc) {
    v.vit += 1; v.pts += 3
    m.der += 1
  } else {
    m.e += 1; m.pts += 1
    v.e += 1; v.pts += 1
  }
}

/**
 * Comparator for group standings — Google / FIFA tiebreaker order:
 * 1. Pts  2. SG  3. GM  4. GC (fewest conceded)
 */
function compareTime(a, b) {
  if (b.pts !== a.pts) return b.pts - a.pts
  if (b.sg !== a.sg)  return b.sg - a.sg
  if (b.gm !== a.gm)  return b.gm - a.gm
  return a.gc - b.gc // fewer goals conceded = better
}

export function useGrupos() {
  const { resultados } = useJogos()

  /**
   * Calculated standings for all 12 groups.
   * Returns: { A: [time1, time2, time3, time4], B: [...], ... }
   * Each time has: { nome, pj, vit, e, der, gm, gc, sg, pts, pos, status }
   */
  const gruposCalculados = computed(() => {
    const result = {}

    GRUPOS.forEach(grupo => {
      const times = buildTimes(grupo)
      const jogosDoGrupo = jogosGrupo.filter(j => j.grupo === grupo)

      // Apply all known results
      jogosDoGrupo.forEach(jogo => {
        const res = resultados.value[jogo.id]
        if (res && (res.finalizado || (res.gols_mandante != null && res.gols_visitante != null))) {
          applyResultado(
            times,
            jogo.mandante,
            jogo.visitante,
            res.gols_mandante,
            res.gols_visitante
          )
        }
      })

      // Sort by FIFA criteria
      const sorted = Object.values(times).sort(compareTime)

      // Attach position (1-indexed)
      sorted.forEach((t, i) => { t.pos = i + 1 })

      result[grupo] = sorted
    })

    return result
  })

  /**
   * All 3rd-place teams sorted — used to determine the best 8.
   * Returns array of { nome, grupo, ...stats } sorted by compareTime.
   */
  const terceirosOrdenados = computed(() => {
    return GRUPOS
      .map(grupo => {
        const times = gruposCalculados.value[grupo]
        if (!times || times.length < 3) return null
        return { ...times[2], grupo }
      })
      .filter(Boolean)
      .sort(compareTime)
  })

  /**
   * Set of group letters whose 3rd-place team is in the best 8.
   */
  const gruposComTerceiroClassificado = computed(() => {
    return new Set(
      terceirosOrdenados.value.slice(0, 8).map(t => t.grupo)
    )
  })

  /**
   * Returns classification status for a team given their position and group.
   * 'advance'  → 1st or 2nd (guaranteed qualifier)
   * 'possible' → 3rd place (may qualify as best 3rd)
   * 'eliminated' → 4th (out)
   */
  function statusTime(pos, grupo) {
    if (pos <= 2) return 'advance'
    if (pos === 3) {
      // Only show as "possible" if not all groups are complete yet,
      // or if this group is among the best 8 thirds
      if (gruposComTerceiroClassificado.value.has(grupo)) return 'possible_confirmed'
      return 'possible'
    }
    return 'eliminated'
  }

  /**
   * Checks if a group has all its games played.
   */
  function grupoCompleto(grupo) {
    const jogosDoGrupo = jogosGrupo.filter(j => j.grupo === grupo)
    return jogosDoGrupo.every(j => {
      const res = resultados.value[j.id]
      return res?.finalizado
    })
  }

  /**
   * Returns the number of games played in a group.
   */
  function jogosPorGrupo(grupo) {
    const jogosDoGrupo = jogosGrupo.filter(j => j.grupo === grupo)
    return jogosDoGrupo.filter(j => {
      const res = resultados.value[j.id]
      return res?.finalizado || (res?.gols_mandante != null && res?.gols_visitante != null)
    }).length
  }

  return {
    GRUPOS,
    gruposCalculados,
    terceirosOrdenados,
    gruposComTerceiroClassificado,
    statusTime,
    grupoCompleto,
    jogosPorGrupo,
  }
}
