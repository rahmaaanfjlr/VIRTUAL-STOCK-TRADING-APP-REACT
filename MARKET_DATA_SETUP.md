# Market chart data setup

The app uses Twelve Data time-series data for the candlestick chart. It does **not** place real trades. The virtual wallet and buy/sell simulation remain separate from the provider's market data.

## Local development

1. Create a Twelve Data API key in your provider account.
2. In the project root, create a file named `.env.local`.
3. Add this line (replace the placeholder with your key):

```env
TWELVE_DATA_API_KEY=your_api_key_here
```

4. Restart the Vite server: `npm run dev`.

The Vite development middleware proxies requests through `/api/market`; the key is not exposed in browser JavaScript. Never commit `.env.local` or paste the key into source files.

## Vercel deployment (later)

In the Vercel project settings, add an Environment Variable named `TWELVE_DATA_API_KEY` with your key, then redeploy. The `api/market.js` serverless function handles production requests.

## Timeframes

- 1D: 5-minute candles
- 1W: 30-minute candles
- 1M: daily candles
- 1Y: weekly candles

Provider access, supported exchanges, delays, and request quotas depend on the data plan. The chart displays demo candles if market data cannot be loaded.

## Important

This is an educational simulator. The chart data is market information, but the app's virtual trade execution prices and wallet are still simulated. It is not a brokerage or investment service.
