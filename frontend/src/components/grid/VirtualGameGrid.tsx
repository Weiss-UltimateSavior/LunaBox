import type { models } from "../../../wailsjs/go/models";
import { useElementScrollRestoration } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { findScrollParent } from "../../utils/scroll";
import { GameCard } from "../card/GameCard";

const CARD_MIN_WIDTH = 140;
const GRID_GAP = 12;
const CARD_IMAGE_ASPECT_RATIO = 3.6 / 3;
const CARD_META_HEIGHT = 56;

interface VirtualGameGridProps {
  games: models.Game[];
  scrollRestorationId: string;
  totalItems?: number;
  searchQuery?: string;
  selectionMode?: boolean;
  selectedGameIds?: Set<string>;
  onSelectChange?: (gameId: string, selected: boolean) => void;
  onNearEnd?: () => void;
  renderOverlay?: (game: models.Game) => React.ReactNode;
}

export function VirtualGameGrid({
  games,
  scrollRestorationId,
  totalItems,
  searchQuery = "",
  selectionMode = false,
  selectedGameIds,
  onSelectChange,
  onNearEnd,
  renderOverlay,
}: VirtualGameGridProps) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);
  const scrollEntry = useElementScrollRestoration({
    id: scrollRestorationId,
  });

  useLayoutEffect(() => {
    const element = measureRef.current;
    if (!element) {
      return;
    }

    const updateLayout = () => {
      const nextScrollElement = findScrollParent(element);
      setScrollElement(nextScrollElement);
      setContainerWidth(element.clientWidth);
      setScrollMargin(() => {
        if (!nextScrollElement) {
          return 0;
        }

        const elementRect = element.getBoundingClientRect();
        const scrollRect = nextScrollElement.getBoundingClientRect();
        return elementRect.top - scrollRect.top + nextScrollElement.scrollTop;
      });
    };

    updateLayout();
    const observer = new ResizeObserver(updateLayout);
    observer.observe(element);
    if (element.parentElement) {
      observer.observe(element.parentElement);
    }
    window.addEventListener("resize", updateLayout);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  const columnCount = Math.max(
    1,
    Math.floor((containerWidth + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)),
  );
  const cardWidth
    = columnCount > 0
      ? (containerWidth - GRID_GAP * (columnCount - 1)) / columnCount
      : CARD_MIN_WIDTH;
  const rowHeight = Math.ceil(
    cardWidth * CARD_IMAGE_ASPECT_RATIO + CARD_META_HEIGHT,
  );
  const virtualItemCount = Math.max(games.length, totalItems ?? games.length);
  const rowCount = Math.ceil(virtualItemCount / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollElement,
    estimateSize: () => rowHeight,
    initialOffset: scrollEntry?.scrollY,
    overscan: 4,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();

  useEffect(() => {
    virtualizer.measure();
  }, [columnCount, rowHeight, virtualizer]);

  useEffect(() => {
    const last = virtualItems.at(-1);
    if (!last || virtualItemCount === 0) {
      return;
    }
    if (totalItems !== undefined && games.length >= totalItems) {
      return;
    }
    if ((last.index + 2) * columnCount >= games.length) {
      onNearEnd?.();
    }
  }, [
    columnCount,
    games.length,
    onNearEnd,
    totalItems,
    virtualItemCount,
    virtualItems,
  ]);

  const handleSelectChange = useCallback(
    (gameId: string, selected: boolean) => {
      onSelectChange?.(gameId, selected);
    },
    [onSelectChange],
  );

  const gridTemplateColumns = useMemo(
    () => `repeat(${columnCount}, minmax(0, 1fr))`,
    [columnCount],
  );

  return (
    <div ref={measureRef} className="w-full">
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount;
          const rowGames = games.slice(startIndex, startIndex + columnCount);
          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 top-0 grid w-full gap-3"
              style={{
                gridTemplateColumns,
                transform: `translateY(${
                  virtualRow.start - virtualizer.options.scrollMargin
                }px)`,
              }}
            >
              {rowGames.map(game => (
                <div key={game.id} className="relative group">
                  <GameCard
                    game={game}
                    searchQuery={searchQuery}
                    selectionMode={selectionMode}
                    selected={selectedGameIds?.has(game.id) ?? false}
                    onSelectChange={selected =>
                      handleSelectChange(game.id, selected)}
                  />
                  {renderOverlay?.(game)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
