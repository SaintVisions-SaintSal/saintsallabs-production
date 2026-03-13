"use client";

import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
}

const defaultTickers: TickerItem[] = [
  { symbol: "BTC", price: "$97,241.83", change: "+2.41%", positive: true },
  { symbol: "S&P 500", price: "5,842.01", change: "+0.87%", positive: true },
  { symbol: "ETH", price: "$3,412.56", change: "-1.23%", positive: false },
  { symbol: "NASDAQ", price: "18,512.30", change: "+1.05%", positive: true },
  { symbol: "SOL", price: "$198.42", change: "+5.12%", positive: true },
];

export function MarketTicker() {
  const [tickers, setTickers] = useState<TickerItem[]>(defaultTickers);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset((prev) => prev - 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reset offset when it's scrolled past content width to create seamless loop
    const resetThreshold = -(tickers.length * 200);
    if (offset < resetThreshold) {
      setOffset(0);
    }
  }, [offset, tickers.length]);

  return (
    <div className="overflow-hidden border-b border-slate-800 bg-background-dark/50">
      <div
        className="flex items-center h-8 gap-8 whitespace-nowrap"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {[...tickers, ...tickers].map((ticker, i) => (
          <div
            key={`${ticker.symbol}-${i}`}
            className="flex items-center gap-2 text-xs font-display"
          >
            <span className="text-slate-400">{ticker.symbol}</span>
            <span className="text-slate-200">{ticker.price}</span>
            <span
              className={
                ticker.positive ? "text-emerald-400" : "text-red-400"
              }
            >
              {ticker.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
