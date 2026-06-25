"use client";

import { useEffect, useMemo, useState } from "react";

interface BidTickerProps {
  currentBid: number;
  startingPrice: number;
  reservePrice: number | null;
  currency: string;
  endTime: string;
  minIncrement: number;
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function useCountdown(endTime: string) {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, new Date(endTime).getTime() - Date.now())
  );

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, new Date(endTime).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const ended = remaining <= 0;

  return { hours, minutes, seconds, ended };
}

/**
 * Signature element: renders the current high bid as an ascending figure
 * with a thin "heat gauge" rule beneath it. The rule fills toward the
 * reserve price the way a kiln gauge climbs toward temperature —
 * a quiet nod to the clay and bronze work this platform exists for,
 * without being a literal kiln illustration.
 */
export function BidTicker({
  currentBid,
  startingPrice,
  reservePrice,
  currency,
  endTime,
  minIncrement,
}: BidTickerProps) {
  const { hours, minutes, seconds, ended } = useCountdown(endTime);

  const heatPct = useMemo(() => {
    if (!reservePrice || reservePrice <= startingPrice) return 100;
    const pct = ((currentBid - startingPrice) / (reservePrice - startingPrice)) * 100;
    return Math.min(100, Math.max(4, pct));
  }, [currentBid, startingPrice, reservePrice]);

  const metReserve = reservePrice ? currentBid >= reservePrice : true;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            Current bid
          </p>
          <p
            key={currentBid}
            className="font-display text-4xl text-ink tabular-nums [animation:bid-rise_320ms_ease-out]"
          >
            {formatMoney(currentBid, currency)}
          </p>
        </div>

        <div className="text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {ended ? "Auction ended" : "Closes in"}
          </p>
          <p className="font-mono text-lg text-clay-red tabular-nums">
            {ended
              ? "—"
              : `${hours.toString().padStart(2, "0")}:${minutes
                  .toString()
                  .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`}
          </p>
        </div>
      </div>

      {/* Heat gauge — fills as bidding approaches/exceeds the reserve */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${heatPct}%`,
            background: metReserve
              ? "linear-gradient(90deg, var(--color-sienna), var(--color-gold))"
              : "var(--color-sienna)",
          }}
        />
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-ink-soft">
        {metReserve
          ? "Reserve met"
          : reservePrice
            ? `Reserve not yet met`
            : "No reserve"}
        {" · "}Next bid min. {formatMoney(currentBid + minIncrement, currency)}
      </p>

      <style>{`
        @keyframes bid-rise {
          from { opacity: 0.3; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tabular-nums { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
