import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_PATH = path.join(__dirname, '../src/data/jogos.json');
const FIFA_API_URL = 'https://api.fifa.com/api/v3/calendar/matches?language=pt&count=500&idSeason=285023';

const TEAM_NAME_MAPPING = {
  "EUA": "Estados Unidos",
  "Curaçau": "Curaçao",
  "RD do Congo": "RD Congo",
  "República da Coreia": "Coreia do Sul",
  "RI do Irã": "Irã"
};

function formatTeamName(teamName, placeholder) {
  if (teamName) {
    return TEAM_NAME_MAPPING[teamName] || teamName;
  }
  if (placeholder) {
    if (placeholder.startsWith('W')) {
      return `Venc. Jogo ${placeholder.slice(1)}`;
    }
    if (placeholder.startsWith('RU')) {
      return `Perd. Jogo ${placeholder.slice(2)}`;
    }
    if (placeholder.match(/^[1-2][A-L]$/)) {
      const position = placeholder[0] === '1' ? 'Venc.' : '2º';
      return `${position} Grupo ${placeholder[1]}`;
    }
    if (placeholder.startsWith('3')) {
      const groups = placeholder.slice(1).split('').join('/');
      return `3º Grupo ${groups}`;
    }
    return placeholder;
  }
  return null;
}

function getBrazilTime(utcDateStr) {
  const date = new Date(utcDateStr);
  // Remove 3 hours for UTC-3 (Brazil time)
  date.setUTCHours(date.getUTCHours() - 3);
  return date.toISOString().substring(0, 19);
}

async function run() {
  try {
    const res = await fetch(FIFA_API_URL);
    const data = await res.json();
    
    // Ler jogos.json atual
    const rawData = fs.readFileSync(JSON_PATH, 'utf-8');
    const jogos = JSON.parse(rawData);

    // Pegar apenas os jogos a partir das oitavas (id 73 em diante)
    const matchesApi = data.Results.filter(m => m.MatchNumber >= 73);

    for (const matchApi of matchesApi) {
      const homeName = matchApi.Home ? matchApi.Home.TeamName[0].Description : null;
      const awayName = matchApi.Away ? matchApi.Away.TeamName[0].Description : null;

      const formattedHome = formatTeamName(homeName, matchApi.PlaceHolderA);
      const formattedAway = formatTeamName(awayName, matchApi.PlaceHolderB);

      const brazilTime = getBrazilTime(matchApi.Date);

      // Encontra e atualiza no json local
      const index = jogos.findIndex(j => j.id === matchApi.MatchNumber);
      if (index !== -1) {
        jogos[index].mandante = formattedHome;
        jogos[index].visitante = formattedAway;
        jogos[index].data = brazilTime;
        // Atualizar estadio
        if (matchApi.Stadium && matchApi.Stadium.Name && matchApi.Stadium.CityName) {
           jogos[index].estadio = `${matchApi.Stadium.Name[0].Description}, ${matchApi.Stadium.CityName[0].Description}`;
        }
      }
    }

    fs.writeFileSync(JSON_PATH, JSON.stringify(jogos, null, 2) + '\n', 'utf-8');
    console.log('Mata-mata atualizado com sucesso no jogos.json!');

  } catch (error) {
    console.error('Erro ao buscar dados da FIFA:', error);
  }
}

run();
