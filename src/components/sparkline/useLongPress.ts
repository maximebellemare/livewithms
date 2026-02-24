import { useRef, useState } from "react";

/** Pointer-event handlers that distinguish tap vs long-press. */
export function useLongPress(onClick?: () => void, onLongPress?: () => void, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const start = () => {
    fired.current = false;
    setIsPressing(true);
    timer.current = setTimeout(() => {
      fired.current = true;
      setIsPressing(false);
      navigator.vibrate?.([30, 50, 30]);
      onLongPress?.();
    }, delay);
  };

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
    setIsPressing(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (fired.current) { e.preventDefault(); e.stopPropagation(); return; }
    onClick?.();
  };

  return {
    isPressing,
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClick: handleClick,
  };
}
