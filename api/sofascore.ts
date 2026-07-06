export const config = {
  // Use nodejs runtime instead of edge because got-scraping relies on node standard libraries
  runtime: 'nodejs',
};

import { createClient } from '@supabase/supabase-js';

export default async function handler(req: Request) {
  try {
    if (req.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const eventId = url.searchParams.get('eventId');
    
    // Dynamic import to avoid issues if Vercel somehow tries to bundle it statically for Edge
    const { gotScraping } = await import('got-scraping');

    if (eventId) {
      const response = await gotScraping({
        url: `https://api.sofascore.com/api/v1/event/${eventId}/graph`,
        headerGeneratorOptions: {
          browsers: ['chrome'],
          operatingSystems: ['windows', 'macos'],
        },
      });
      const data = JSON.parse(response.body);
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Fetch today's matches and update their volume data
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get today's dates in UTC
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: jogos, error } = await supabase
        .from('jogos')
        .select('id, sofascore_id')
        .gte('data', startOfDay.toISOString())
        .lte('data', endOfDay.toISOString())
        .not('sofascore_id', 'is', null);

      if (error) throw error;

      if (!jogos || jogos.length === 0) {
        return new Response(JSON.stringify({ message: 'No matches found for today with sofascore_id' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const results = [];
      for (const jogo of jogos) {
        try {
          const response = await gotScraping({
            url: `https://api.sofascore.com/api/v1/event/${jogo.sofascore_id}/graph`,
            headerGeneratorOptions: {
              browsers: ['chrome'],
              operatingSystems: ['windows', 'macos'],
            },
          });
          const data = JSON.parse(response.body);
          
          const graphData = data.graph || data.graphPoints;
          if (graphData) {
             const { error: updateError } = await supabase
               .from('jogos')
               .update({ volume_data: graphData })
               .eq('id', jogo.id);
             
             if (updateError) {
               results.push({ id: jogo.id, status: 'error', error: updateError.message });
             } else {
               results.push({ id: jogo.id, status: 'success' });
             }
          } else {
             results.push({ id: jogo.id, status: 'no_graph_data' });
          }
        } catch (e: any) {
          results.push({ id: jogo.id, status: 'error', error: e.message });
        }
      }

      return new Response(JSON.stringify({ message: 'Sync complete', results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in sofascore endpoint:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        statusCode: error.response?.statusCode,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
