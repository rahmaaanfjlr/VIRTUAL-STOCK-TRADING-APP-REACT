const ALLOWED_SYMBOLS = new Set(['AAPL','MSFT','AMZN','TSLA','NVDA','GOOGL','META','NFLX','KO','JPM'])
const ALLOWED_INTERVALS = new Set(['5min','30min','1day','1week'])

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' })
  const symbol = String(req.query.symbol || '').toUpperCase()
  const interval = String(req.query.interval || '1day')
  if (!ALLOWED_SYMBOLS.has(symbol) || !ALLOWED_INTERVALS.has(interval)) {
    return res.status(400).json({ error: 'Unsupported symbol or timeframe.' })
  }
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'Market data API key is not configured.' })
  try {
    const url = new URL('https://api.twelvedata.com/time_series')
    url.search = new URLSearchParams({
      symbol, interval, outputsize: '100', timezone: 'UTC', apikey: apiKey
    })
    const upstream = await fetch(url)
    const payload = await upstream.json()
    if (!upstream.ok || !payload.values) {
      return res.status(502).json({ error: payload.message || 'Market data provider error.' })
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.status(200).json({ values: payload.values, meta: payload.meta })
  } catch {
    return res.status(502).json({ error: 'Could not reach the market data provider.' })
  }
}
