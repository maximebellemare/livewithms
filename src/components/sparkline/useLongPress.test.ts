import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLongPress } from "./useLongPress";

describe("useLongPress", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("calls onClick on quick tap (no long press)", () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onClick, onLongPress));

    act(() => { result.current.onPointerDown(); });
    act(() => { result.current.onPointerUp(); });
    // Simulate native click event
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as React.MouseEvent;
    act(() => { result.current.onClick(event); });

    expect(onClick).toHaveBeenCalledOnce();
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("calls onLongPress after delay and suppresses onClick", () => {
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(onClick, onLongPress, 500));

    act(() => { result.current.onPointerDown(); });
    act(() => { vi.advanceTimersByTime(500); });

    expect(onLongPress).toHaveBeenCalledOnce();

    // Subsequent click should be suppressed
    const event = { preventDefault: vi.fn(), stopPropagation: vi.fn() } as unknown as React.MouseEvent;
    act(() => { result.current.onClick(event); });
    expect(onClick).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("does not fire onLongPress if pointer is released early", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(undefined, onLongPress, 500));

    act(() => { result.current.onPointerDown(); });
    act(() => { vi.advanceTimersByTime(200); });
    act(() => { result.current.onPointerUp(); });
    act(() => { vi.advanceTimersByTime(500); });

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it("sets isPressing during long-press hold", () => {
    const { result } = renderHook(() => useLongPress(undefined, vi.fn(), 500));

    expect(result.current.isPressing).toBe(false);
    act(() => { result.current.onPointerDown(); });
    expect(result.current.isPressing).toBe(true);
    act(() => { result.current.onPointerUp(); });
    expect(result.current.isPressing).toBe(false);
  });

  it("cancels on pointer leave", () => {
    const onLongPress = vi.fn();
    const { result } = renderHook(() => useLongPress(undefined, onLongPress, 500));

    act(() => { result.current.onPointerDown(); });
    act(() => { result.current.onPointerLeave(); });
    act(() => { vi.advanceTimersByTime(600); });

    expect(onLongPress).not.toHaveBeenCalled();
  });
});
