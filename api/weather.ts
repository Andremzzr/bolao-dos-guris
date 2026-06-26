export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    if (req.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');

    if (!lat || !lon) {
      return new Response(JSON.stringify({ error: 'Missing lat or lon' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.WEATHER_API;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing OpenWeather API key configuration' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    const weatherRes = await fetch(weatherUrl);
    
    if (!weatherRes.ok) {
      const errorText = await weatherRes.text();
      throw new Error(`OpenWeather API returned ${weatherRes.status}: ${errorText}`);
    }

    const weatherData = await weatherRes.json();

    if (!weatherData.main) {
      throw new Error('No weather data found in response');
    }

    const result = {
      temp: Math.round(weatherData.main.temp),
      icon: weatherData.weather?.[0]?.icon || '01d',
      description: weatherData.weather?.[0]?.description || '',
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' // Cache for 30 minutes
      },
    });
  } catch (error: any) {
    console.error('Error fetching weather:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
