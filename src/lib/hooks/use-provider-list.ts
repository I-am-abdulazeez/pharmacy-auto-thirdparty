import type { Provider } from "@/types";

import { useState, useEffect } from "react";

import { fetchSelectProviders } from "@/lib/services/fetch-pro-select";

export function useProviderList({
  enrolleeId,
  fetchDelay = 0,
}: { enrolleeId?: string; fetchDelay?: number } = {}) {
  const [displayedItems, setDisplayedItems] = useState<Provider[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const loadProviders = async (reset = false) => {
    if (!enrolleeId) {
      setDisplayedItems([]);
      setHasMore(false);
      setError(null);

      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (fetchDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, fetchDelay));
      }

      const currentOffset = reset ? 0 : offset;

      const { providers, hasMore: moreAvailable } =
        await fetchSelectProviders(currentOffset, limit, enrolleeId);


      if (reset) {
        setDisplayedItems(providers);
      } else {
        const existingIds = new Set(displayedItems.map((item) => item.Pharmacyid));
        const newItems = providers.filter((item) => !existingIds.has(item.Pharmacyid));

        setDisplayedItems((prev) => [...prev, ...newItems]);
      }

      setHasMore(moreAvailable);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load providers";

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const retry = () => {
    if (displayedItems.length === 0) {
      setOffset(0);
      loadProviders(true);
    } else {
      loadProviders(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    loadProviders(true);
  }, [enrolleeId]);

  const onLoadMore = () => {
    if (!isLoading && hasMore) {
      setOffset((prev) => prev + limit);
      loadProviders(false);
    }
  };

  return {
    items: displayedItems,
    hasMore,
    isLoading,
    error,
    onLoadMore,
    retry,
    setDisplayedItems,
  };
}
