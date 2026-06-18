import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to load .env file manually in case Node version doesn't support --env-file
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes if present
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no .env.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importJogos() {
  try {
    const jsonPath = path.join(__dirname, '../src/data/jogos.json');
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const jogos = JSON.parse(rawData);

    // Filtrar apenas os jogos da fase de grupos conforme solicitado
    const jogosFaseGrupos = jogos.filter(j => j.fase && j.fase.startsWith('Fase de Grupos'));

    console.log(`Encontrados ${jogosFaseGrupos.length} jogos da fase de grupos em jogos.json.`);

    // Inserir os jogos no banco
    const { data, error } = await supabase
      .from('jogos')
      .upsert(jogosFaseGrupos, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('Erro ao importar os jogos para o Supabase:', error);
    } else {
      console.log('Importação concluída com sucesso!');
      console.log(`Foram inseridos/atualizados ${data?.length || 0} jogos na tabela "jogos".`);
    }
  } catch (err) {
    console.error('Erro inesperado durante a importação:', err);
  }
}

importJogos();
