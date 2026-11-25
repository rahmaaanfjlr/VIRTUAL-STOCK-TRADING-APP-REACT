import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const allowedSymbols = new Set(['AAPL','MSFT','AMZN','TSLA','NVDA','GOOGL','META','NFLX','KO','JPM'])
const allowedIntervals = new Set(['5min','30min','1day','1week'])

function marketApi(apiKey) {
  return {
    name: 'market-data-api',
    configureServer(server) {
      server.middlewares.use('/api/market', async (req, res) => {
        const url = new URL(req.url, 'http://localhost')
        const symbol = (url.searchParams.get('symbol') || '').toUpperCase()
        const interval = url.searchParams.get('interval') || '1day'
        if (!allowedSymbols.has(symbol) || !allowedIntervals.has(interval)) {
          res.statusCode = 400; res.setHeader('Content-Type','application/json')
          return res.end(JSON.stringify({ error: 'Unsupported symbol or timeframe.' }))
        }
        if (!apiKey) {
          res.statusCode = 503; res.setHeader('Content-Type','application/json')
          return res.end(JSON.stringify({ error: 'Twelve Data API key is not configured.' }))
        }
        try {
          const endpoint = new URL('https://api.twelvedata.com/time_series')
          endpoint.search = new URLSearchParams({ symbol, interval, outputsize: '100', apikey: apiKey })
          const response = await fetch(endpoint)
          const data = await response.json()
          res.statusCode = response.ok && data.values ? 200 : 502
          res.setHeader('Content-Type','application/json')
          res.setHeader('Cache-Control','no-store')
          res.end(JSON.stringify(data.values ? { values: data.values } : { error: data.message || 'Market data provider error.' }))
        } catch {
          res.statusCode = 502; res.setHeader('Content-Type','application/json')
          res.end(JSON.stringify({ error: 'Could not reach the market data provider.' }))
        }
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), marketApi(env.TWELVE_DATA_API_KEY)],
    server: { watch: { usePolling: true } },
  }
})
