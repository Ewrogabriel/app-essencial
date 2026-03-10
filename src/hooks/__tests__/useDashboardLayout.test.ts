import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDashboardLayout } from "../useDashboardLayout";

describe("useDashboardLayout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return default layout items", () => {
    const { result } = renderHook(() => useDashboardLayout());
    expect(result.current.layout).toBeDefined();
    expect(Array.isArray(result.current.layout)).toBe(true);
    expect(result.current.layout.length).toBeGreaterThan(0);
  });

  it("should toggle item visibility", () => {
    const { result } = renderHook(() => useDashboardLayout());
    const firstItem = result.current.layout[0];
    const initialVisible = firstItem.visible;

    act(() => {
      result.current.toggleItem(firstItem.id);
    });

    const updated = result.current.layout.find((i) => i.id === firstItem.id);
    expect(updated?.visible).toBe(!initialVisible);
  });

  it("should reset to default layout", () => {
    const { result } = renderHook(() => useDashboardLayout());

    // Toggle one off
    act(() => {
      result.current.toggleItem(result.current.layout[0].id);
    });

    act(() => {
      result.current.resetLayout();
    });

    // All should be visible again
    expect(result.current.layout.every((i) => i.visible)).toBe(true);
  });
});
