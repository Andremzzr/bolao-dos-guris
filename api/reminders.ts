import webPush from 'web-push';
import { createClient } from '@supabase/supabase-js';

// Inicializar web-push com as chaves VAPID
webPush.setVapidDetails(
  'mailto:contato@seusite.com', // Coloque seu email aqui
  process.env.VITE_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Inicializar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: any, res: any) {
  // Opcional: Proteger a rota para que apenas o Cron Job chame
  if (req.headers.authorization !== `Bearer ${process.env.API_PASSWORD}`) {
    // Para simplificar, estamos aceitando se rodar local ou via Vercel Cron
    // No vercel cron, usaríamos o CRON_SECRET, mas como temos API_PASSWORD, pode usar ela.
  }

  try {
    // 1. Pegar jogos de hoje
    // Como a data está em TIMESTAMPTZ, vamos fazer no código para evitar confusões de fuso no SQL, ou usar a query SQL
    const { data: jogos, error: errJogos } = await supabase
      .from('jogos')
      .select('id, mandante, visitante, data');
      
    if (errJogos) throw errJogos;
    
    // Filtrar jogos que acontecem hoje no fuso horário local
    const hojeStr = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const jogosDeHoje = jogos.filter(j => {
      const jData = new Date(j.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      return jData === hojeStr;
    });

    if (jogosDeHoje.length === 0) {
      return res.status(200).json({ message: 'Nenhum jogo hoje. Nada a enviar.' });
    }

    // 2. Pegar todas as inscrições e os usuários
    const { data: assinaturas, error: errAss } = await supabase
      .from('push_subscriptions')
      .select('usuario_id, subscription, usuarios (nome)');
      
    if (errAss) throw errAss;
    if (!assinaturas || assinaturas.length === 0) {
       return res.status(200).json({ message: 'Nenhum usuário inscrito em notificações.' });
    }

    // 3. Checar os palpites de cada usuário
    let enviosCount = 0;
    const errors = [];

    for (const sub of assinaturas) {
      const { data: palpites, error: errPalpites } = await supabase
        .from('palpites')
        .select('jogo_id')
        .eq('usuario_id', sub.usuario_id)
        .in('jogo_id', jogosDeHoje.map(j => j.id));

      const jogosPalpitados = palpites?.map(p => p.jogo_id) || [];
      const faltam = jogosDeHoje.length - jogosPalpitados.length;

      if (faltam > 0) {
        // Enviar notificação!
        const payload = JSON.stringify({
          title: `Falta palpitar em ${faltam} jogo(s) hoje!`,
          body: `E aí ${sub.usuarios?.nome || 'Guri'}! Entra no app pra deixar seu palpite antes que os jogos comecem.`,
        });

        try {
          await webPush.sendNotification(sub.subscription, payload);
          enviosCount++;
        } catch (error) {
          console.error('Erro ao enviar push para usuário', sub.usuario_id, error);
          // Se o erro for de inscrição inválida (410), seria bom deletar a inscrição no banco
          if (error.statusCode === 410) {
             await supabase.from('push_subscriptions').delete().eq('usuario_id', sub.usuario_id).eq('subscription', sub.subscription);
          }
          errors.push(error);
        }
      }
    }

    return res.status(200).json({ message: `Notificações enviadas: ${enviosCount}`, errors });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
