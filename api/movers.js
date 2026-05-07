const { getQuote } = require('./_utils');

const OMXS_TICKERS = [
  'ERIC-B.ST','VOLV-B.ST','SAND.ST','SEB-A.ST','SHB-A.ST','SWED-A.ST',
  'ATCO-A.ST','INVE-B.ST','ABB.ST','SKF-B.ST','ALFA.ST','GETI-B.ST',
  'NDA-SE.ST','AZN.ST','HEXA-B.ST','ELUX-B.ST','HM-B.ST','SSAB-A.ST',
  'TELIA.ST','BOL.ST','NIBE-B.ST','HUSQ-B.ST','BURE.ST','SINCH.ST',
  'HANZA.ST','EKTA-B.ST','GRNG.ST','KNOW.ST','VOLAT.ST','REJL-B.ST',
  'CAST.ST','PEAB-B.ST','LUND-B.ST','TOBII.ST','BETCO.ST',
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  try {
    const batchSize = 8;
    const results = [];
    for (let i = 0; i < OMXS_TICKERS.length; i += batchSize) {
      const batch = OMXS_TICKERS.slice(i, i + batchSize);
      const quotes = await Promise.all(batch.map(t => getQuote(t)));
      quotes.forEach(q => { if (q && q.price && q.prevClose) results.push(q); });
    }

    const sorted = results.sort((a, b) => b.dayChange_pct - a.dayChange_pct);
    const winners = sorted.slice(0, 10).map(q => ({
      ticker: q.ticker, name: q.name, price: q.price,
      dayChange_pct: q.dayChange_pct, dayChange_kr: q.dayChange_kr, volume: q.volume,
    }));
    const losers = sorted.slice(-10).reverse().map(q => ({
      ticker: q.ticker, name: q.name, price: q.price,
      dayChange_pct: q.dayChange_pct, dayChange_kr: q.dayChange_kr, volume: q.volume,
    }));
    const mostTraded = [...results]
      .filter(q => q.volume)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map(q => ({ ticker: q.ticker, name: q.name, price: q.price, dayChange_pct: q.dayChange_pct, volume: q.volume }));

    res.status(200).json({
      generated: new Date().toISOString(),
      totalTracked: results.length,
      winners, losers, mostTraded,
    });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
