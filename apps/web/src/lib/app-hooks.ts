import { useEffect, useRef, useCallback, type RefObject, type PointerEvent as ReactPointerEvent } from "react";

const APP_BACK_HISTORY_MARKER = "__edgeever_app_back__";
const BOTTOM_SHEET_DISMISS_DISTANCE_PX = 72;
const BOTTOM_SHEET_DISMISS_VELOCITY_PX_PER_MS = 0.55;

export const DIALOG_FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export const getFocusableElements = (node: HTMLElement | null) => {
  if (!node) {
    return [];
  }

  return Array.from(node.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR)).filter((element) => {
    const isVisible = element.offsetWidth > 0 || element.offsetHeight > 0 || element.getClientRects().length > 0;

    return isVisible && !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true";
  });
};

export const isTextEntryTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(target.closest("input, textarea, select, [contenteditable='true'], [role='textbox'], .ProseMirror"));

export const useDismissableLayer = <T extends HTMLElement>(open: boolean, onClose: () => void) => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const node = ref.current;

      if (!node || node.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  return ref;
};

export type BrowserBackLayer = {
  id: string;
  onBack: () => void;
};

let browserBackLayerCounter = 0;
let browserBackLayerPopStateAttached = false;
let browserBackLayerSuppressNextPopState = false;
const browserBackLayerStack: BrowserBackLayer[] = [];

const getBrowserBackMarker = () =>
  window.history.state && typeof window.history.state === "object"
    ? (window.history.state as Record<string, unknown>)[APP_BACK_HISTORY_MARKER]
    : null;

const removeBrowserBackLayer = (id: string) => {
  for (let index = browserBackLayerStack.length - 1; index >= 0; index -= 1) {
    if (browserBackLayerStack[index]?.id === id) {
      browserBackLayerStack.splice(index, 1);
    }
  }
};

const hasBrowserBackLayer = (id: string) => browserBackLayerStack.some((layer) => layer.id === id);

const ensureBrowserBackLayerListener = () => {
  if (browserBackLayerPopStateAttached) {
    return;
  }

  window.addEventListener("popstate", () => {
    if (browserBackLayerSuppressNextPopState) {
      browserBackLayerSuppressNextPopState = false;
      return;
    }

    const layer = browserBackLayerStack.at(-1);

    if (!layer) {
      return;
    }

    removeBrowserBackLayer(layer.id);
    layer.onBack();
  });
  browserBackLayerPopStateAttached = true;
};

export const useBrowserBackLayer = (active: boolean, onBack: () => void) => {
  const idRef = useRef("");
  const onBackRef = useRef(onBack);

  if (!idRef.current) {
    browserBackLayerCounter += 1;
    idRef.current = `edgeever-back-layer-${browserBackLayerCounter}`;
  }

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active) {
      return;
    }

    ensureBrowserBackLayerListener();

    const id = idRef.current;
    const currentState =
      window.history.state && typeof window.history.state === "object" ? window.history.state : {};
    const layer: BrowserBackLayer = {
      id,
      onBack: () => onBackRef.current(),
    };

    browserBackLayerStack.push(layer);
    window.history.pushState(
      {
        ...currentState,
        [APP_BACK_HISTORY_MARKER]: id,
      },
      "",
      window.location.href
    );

    return () => {
      removeBrowserBackLayer(id);

      window.setTimeout(() => {
        if (hasBrowserBackLayer(id) || getBrowserBackMarker() !== id) {
          return;
        }

        browserBackLayerSuppressNextPopState = true;
        window.history.back();
      }, 0);
    };
  }, [active]);
};

export const useFloatingMenuControls = <T extends HTMLElement>(ref: RefObject<T | null>, open: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const node = ref.current;

    if (!node) {
      return;
    }

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const getMenuItems = () => {
      const menuNode = node.querySelector<HTMLElement>("[role='menu']") ?? node;

      return getFocusableElements(menuNode).filter((element) => element.getAttribute("role") === "menuitem" || element.tagName === "BUTTON");
    };
    const restoreFocusToTrigger = () => {
      if (!previouslyFocusedElement?.isConnected) {
        return;
      }

      window.setTimeout(() => {
        const activeElement = document.activeElement;
        const hasExternalFocus =
          activeElement instanceof HTMLElement && activeElement !== document.body && !node.contains(activeElement);

        if (hasExternalFocus) {
          return;
        }

        previouslyFocusedElement.focus();
      }, 0);
    };
    const focusTimer = window.setTimeout(() => getMenuItems()[0]?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        restoreFocusToTrigger();
        return;
      }

      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") {
        return;
      }

      const menuItems = getMenuItems();

      if (menuItems.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const currentIndex = menuItems.findIndex((element) => element === document.activeElement);
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? menuItems.length - 1
            : event.key === "ArrowDown"
              ? (Math.max(currentIndex, 0) + 1) % menuItems.length
              : (currentIndex <= 0 ? menuItems.length : currentIndex) - 1;

      menuItems[nextIndex]?.focus();
    };

    node.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      node.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open, ref]);
};

export const useFocusTrap = <T extends HTMLElement>(ref: RefObject<T | null>, active = true) => {
  useEffect(() => {
    if (!active) {
      return;
    }

    const node = ref.current;

    if (!node) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements(node);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement || !node.contains(document.activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    node.addEventListener("keydown", handleKeyDown);

    return () => node.removeEventListener("keydown", handleKeyDown);
  }, [active, ref]);
};

export const useModalLayerControls = <T extends HTMLElement>(
  ref: RefObject<T | null>,
  onClose: () => void,
  {
    active = true,
    closeOnEscape = true,
    closeOnBrowserBack = false,
    initialFocus = true,
    restoreFocus = true,
  }: {
    active?: boolean;
    closeOnEscape?: boolean;
    closeOnBrowserBack?: boolean;
    initialFocus?: boolean;
    restoreFocus?: boolean;
  } = {}
) => {
  useFocusTrap(ref, active);
  useBrowserBackLayer(active && closeOnBrowserBack, onClose);

  useEffect(() => {
    if (!active) {
      return;
    }

    const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = initialFocus
      ? window.setTimeout(() => {
          const node = ref.current;

          if (!node || node.contains(document.activeElement)) {
            return;
          }

          getFocusableElements(node)[0]?.focus();
        }, 0)
      : null;

    const node = ref.current;

    if (!node) {
      return () => {
        if (focusTimer !== null) {
          window.clearTimeout(focusTimer);
        }
      };
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      event.stopPropagation();

      if (!closeOnEscape || event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      if (isTextEntryTarget(event.target)) {
        const target = event.target;

        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          if (target.value) {
            return;
          }
        }
      }

      event.preventDefault();
      onClose();
    };

    node.addEventListener("keydown", handleKeyDown);

    return () => {
      if (focusTimer !== null) {
        window.clearTimeout(focusTimer);
      }

      node.removeEventListener("keydown", handleKeyDown);

      if (restoreFocus && previouslyFocusedElement?.isConnected) {
        previouslyFocusedElement.focus({ preventScroll: true });
      }
    };
  }, [active, closeOnEscape, initialFocus, onClose, ref, restoreFocus]);
};

export const useBottomSheetSwipeToClose = <T extends HTMLElement>(sheetRef: RefObject<T | null>, onClose: () => void) => {
  const cleanupDragRef = useRef<(() => void) | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const cleanupDrag = useCallback(() => {
    cleanupDragRef.current?.();
    cleanupDragRef.current = null;
  }, []);

  const resetSheetPosition = useCallback(() => {
    const sheet = sheetRef.current;

    if (!sheet) {
      return;
    }

    sheet.style.transition = "transform 180ms cubic-bezier(0.2, 0, 0, 1)";
    sheet.style.transform = "";
    sheet.style.willChange = "";

    window.setTimeout(() => {
      if (sheetRef.current === sheet) {
        sheet.style.transition = "";
      }
    }, 190);
  }, [sheetRef]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" || !event.isPrimary) {
        return;
      }

      const sheet = sheetRef.current;

      if (!sheet) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      cleanupDrag();

      const pointerId = event.pointerId;
      const startX = event.clientX;
      const startY = event.clientY;
      const startTime = performance.now();
      let latestY = startY;
      let dragging = false;

      const handlePointerMove = (moveEvent: PointerEvent) => {
        if (moveEvent.pointerId !== pointerId) {
          return;
        }

        const deltaY = Math.max(0, moveEvent.clientY - startY);
        const deltaX = Math.abs(moveEvent.clientX - startX);

        if (!dragging && deltaX > deltaY * 1.4 && deltaX > 18) {
          return;
        }

        if (deltaY <= 0) {
          return;
        }

        latestY = moveEvent.clientY;
        dragging = true;
        moveEvent.preventDefault();
        sheet.style.transition = "none";
        sheet.style.transform = `translate3d(0, ${deltaY}px, 0)`;
        sheet.style.willChange = "transform";
      };

      const handlePointerEnd = (endEvent: PointerEvent) => {
        if (endEvent.pointerId !== pointerId) {
          return;
        }

        const deltaY = Math.max(0, latestY - startY);
        const elapsedMs = Math.max(performance.now() - startTime, 1);
        const velocity = deltaY / elapsedMs;

        cleanupDrag();

        if (deltaY >= BOTTOM_SHEET_DISMISS_DISTANCE_PX || velocity >= BOTTOM_SHEET_DISMISS_VELOCITY_PX_PER_MS) {
          sheet.style.transition = "transform 160ms cubic-bezier(0.32, 0.72, 0, 1)";
          sheet.style.transform = "translate3d(0, 110%, 0)";
          sheet.style.willChange = "transform";
          window.setTimeout(() => onCloseRef.current(), 120);
          return;
        }

        resetSheetPosition();
      };

      const handlePointerCancel = (cancelEvent: PointerEvent) => {
        if (cancelEvent.pointerId !== pointerId) {
          return;
        }

        cleanupDrag();
        resetSheetPosition();
      };

      window.addEventListener("pointermove", handlePointerMove, { passive: false });
      window.addEventListener("pointerup", handlePointerEnd);
      window.addEventListener("pointercancel", handlePointerCancel);

      cleanupDragRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerEnd);
        window.removeEventListener("pointercancel", handlePointerCancel);
      };
    },
    [cleanupDrag, resetSheetPosition, sheetRef]
  );

  useEffect(() => cleanupDrag, [cleanupDrag]);

  return handlePointerDown;
};
