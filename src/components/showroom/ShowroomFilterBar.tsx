"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { ARTWORK_CATEGORY_LABELS, REGIONS } from "@/lib/types/database";
import { clsx } from "clsx";

export function ShowroomFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/showroom?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const activeCategory = searchParams.get("category") ?? "";
  const activeRegion = searchParams.get("region") ?? "";
  const activeSaleType = searchParams.get("saleType") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";

  return (
    <div className={clsx("space-y-4", isPending && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft mr-1">
          Medium
        </span>
        <FilterChip
          active={activeCategory === ""}
          onClick={() => setParam("category", null)}
        >
          All
        </FilterChip>
        {Object.entries(ARTWORK_CATEGORY_LABELS).map(([key, label]) => (
          <FilterChip
            key={key}
            active={activeCategory === key}
            onClick={() => setParam("category", key)}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Region
          </span>
          <select
            value={activeRegion}
            onChange={(e) => setParam("region", e.target.value || null)}
            className="rounded-sm border border-ink/20 bg-parchment px-2 py-1 text-sm text-ink"
          >
            <option value="">All regions</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Sale type
          </span>
          <select
            value={activeSaleType}
            onChange={(e) => setParam("saleType", e.target.value || null)}
            className="rounded-sm border border-ink/20 bg-parchment px-2 py-1 text-sm text-ink"
          >
            <option value="">All</option>
            <option value="fixed">Buy now</option>
            <option value="auction">Auction</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Sort
          </span>
          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value)}
            className="rounded-sm border border-ink/20 bg-parchment px-2 py-1 text-sm text-ink"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Price
          </span>
          <input
            type="number"
            placeholder="Min"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => setParam("minPrice", e.target.value || null)}
            className="w-20 rounded-sm border border-ink/20 bg-parchment px-2 py-1 text-sm text-ink"
          />
          <span className="text-ink-soft">–</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => setParam("maxPrice", e.target.value || null)}
            className="w-20 rounded-sm border border-ink/20 bg-parchment px-2 py-1 text-sm text-ink"
          />
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full px-3 py-1 text-sm font-medium transition-colors",
        active
          ? "bg-charcoal text-parchment"
          : "bg-charcoal/8 text-ink hover:bg-charcoal/15"
      )}
    >
      {children}
    </button>
  );
}
