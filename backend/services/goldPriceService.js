const axios = require('axios');

// Live gold price per troy ounce in USD; 1 troy oz = 31.1035 grams
const TROY_OZ_TO_GRAMS = 31.1035;
const FALLBACK_GOLD_USD_OZ = 1980; // fallback price
const FALLBACK_USD_INR = 83.5;

let cachedPrice = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

exports.getGoldPrices = async () => {
  if (cachedPrice && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
    return cachedPrice;
  }

  try {
    let goldUsdOz = FALLBACK_GOLD_USD_OZ;
    let usdToInr = FALLBACK_USD_INR;

    if (process.env.GOLD_API_KEY) {
      const goldRes = await axios.get('https://www.goldapi.io/api/XAU/USD', {
        headers: { 'x-access-token': process.env.GOLD_API_KEY },
        timeout: 5000,
      });
      goldUsdOz = goldRes.data.price || FALLBACK_GOLD_USD_OZ;
    }

    // Fetch USD/INR rate
    try {
      const fxRes = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', { timeout: 5000 });
      usdToInr = fxRes.data.rates?.INR || FALLBACK_USD_INR;
    } catch {}

    const goldUsdPerGram = goldUsdOz / TROY_OZ_TO_GRAMS;
    const goldInrPerGram = goldUsdPerGram * usdToInr;

    cachedPrice = {
      goldUsdPerGram: parseFloat(goldUsdPerGram.toFixed(4)),
      goldInrPerGram: parseFloat(goldInrPerGram.toFixed(2)),
      usdToInr: parseFloat(usdToInr.toFixed(2)),
      goldUsdPerOz: goldUsdOz,
      lastUpdated: new Date().toISOString(),
      source: process.env.GOLD_API_KEY ? 'live' : 'fallback',
    };
    cacheTime = Date.now();
    return cachedPrice;
  } catch (err) {
    console.error('Gold price fetch error:', err.message);
    const goldUsdPerGram = FALLBACK_GOLD_USD_OZ / TROY_OZ_TO_GRAMS;
    return {
      goldUsdPerGram: parseFloat(goldUsdPerGram.toFixed(4)),
      goldInrPerGram: parseFloat((goldUsdPerGram * FALLBACK_USD_INR).toFixed(2)),
      usdToInr: FALLBACK_USD_INR,
      goldUsdPerOz: FALLBACK_GOLD_USD_OZ,
      lastUpdated: new Date().toISOString(),
      source: 'fallback',
    };
  }
};
