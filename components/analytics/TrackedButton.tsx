"use client";

import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from "react";
import {
  trackEvent,
  type GtagEventName,
  type GtagEventParams,
} from "@/lib/analytics";

interface TrackedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  event: GtagEventName;
  params?: GtagEventParams;
}

// Generic button wrapper that fires a typed gtag event on click and still
// runs whatever onClick the consumer passed.
const TrackedButton = forwardRef<HTMLButtonElement, TrackedButtonProps>(
  function TrackedButton({ event, params, onClick, ...rest }, ref) {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      trackEvent(event, params);
      onClick?.(e);
    };
    return <button ref={ref} {...rest} onClick={handleClick} />;
  },
);

export default TrackedButton;

// Pre-bound shortcuts for the events the spec calls out by name.
export const RequestAccessButton = forwardRef<
  HTMLButtonElement,
  Omit<TrackedButtonProps, "event">
>(function RequestAccessButton(props, ref) {
  return <TrackedButton ref={ref} event="request_access_click" {...props} />;
});

export const StartNowButton = forwardRef<
  HTMLButtonElement,
  Omit<TrackedButtonProps, "event">
>(function StartNowButton(props, ref) {
  return <TrackedButton ref={ref} event="start_now_click" {...props} />;
});
