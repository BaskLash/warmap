// Tiny throttle/debounce utilities. No deps, no allocations on the hot path.
// Used by analytics call sites to avoid spamming gtag with high-frequency
// events (mousemove, scroll, search input).

export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): (...args: A) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let trailingArgs: A | null = null;
  return (...args: A) => {
    const now = Date.now();
    const remaining = delayMs - (now - last);
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = now;
      fn(...args);
    } else {
      trailingArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          if (trailingArgs) fn(...trailingArgs);
          trailingArgs = null;
        }, remaining);
      }
    }
  };
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delayMs: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
