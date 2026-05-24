import type { RefObject } from "react";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { findScrollParent, getScrollTop, scrollToTop } from "../utils/scroll";

type UsePageScrollControlsOptions = {
  anchorRef: RefObject<HTMLElement>;
  enabled: boolean;
  toolbarRef: RefObject<HTMLElement>;
};

export function usePageScrollControls({
  anchorRef,
  enabled,
  toolbarRef,
}: UsePageScrollControlsOptions) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollElementRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const anchor = anchorRef.current ?? toolbarRef.current;
    const scrollElement = findScrollParent(anchor);
    scrollElementRef.current = scrollElement;

    return () => {
      scrollElementRef.current = null;
    };
  }, [anchorRef, enabled, toolbarRef]);

  useEffect(() => {
    if (!enabled || !toolbarRef.current) {
      return;
    }

    const toolbar = toolbarRef.current;
    const root = scrollElementRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollTop(!entry.isIntersecting && getScrollTop(root) > 0);
      },
      { root, threshold: 0 },
    );

    observer.observe(toolbar);
    return () => observer.disconnect();
  }, [enabled, toolbarRef]);

  const handleScrollToTop = useCallback(() => {
    scrollToTop(scrollElementRef.current);
  }, []);

  return {
    scrollToTop: handleScrollToTop,
    showScrollTop,
  };
}
