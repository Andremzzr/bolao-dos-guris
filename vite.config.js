import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'vercel-api-dev-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/weather')) {
            try {
              const url = new URL(req.url, `http://${req.headers.host}`);
              const lat = url.searchParams.get('lat');
              const lon = url.searchParams.get('lon');
              
              if (!lat || !lon) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Missing lat or lon' }));
                return;
              }

              const apiKey = env.WEATHER_API;

              if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Missing WEATHER_API' }));
                return;
              }

              const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
              const weatherRes = await fetch(weatherUrl);
              const weatherData = await weatherRes.json();

              if (!weatherRes.ok) {
                res.statusCode = weatherRes.status;
                res.end(JSON.stringify({ error: weatherData }));
                return;
              }

              const result = {
                temp: Math.round(weatherData.main.temp),
                icon: weatherData.weather?.[0]?.icon || '01d',
                description: weatherData.weather?.[0]?.description || '',
              };

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
