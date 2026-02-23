export type SnapTarget =
  | { type: "left"; x: number; y: number; w: number; h: number }
  | { type: "right"; x: number; y: number; w: number; h: number }
  | { type: "top"; x: number; y: number; w: number; h: number }
  | { type: "top-left"; x: number; y: number; w: number; h: number }
  | { type: "top-right"; x: number; y: number; w: number; h: number }
  | { type: "bottom-left"; x: number; y: number; w: number; h: number }
  | { type: "bottom-right"; x: number; y: number; w: number; h: number }
  | null;

export const getSnapTarget = (
  clientX: number,
  clientY: number,
  bounds: DOMRect
): SnapTarget => {
  const threshold = 28;
  const nearLeft = clientX - bounds.left <= threshold;
  const nearRight = bounds.right - clientX <= threshold;
  const nearTop = clientY - bounds.top <= threshold;
  const nearBottom = bounds.bottom - clientY <= threshold;

  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;

  // Corners first (more specific) — require both edges near
  if (nearTop && nearLeft) {
    return { type: "top-left", x: bounds.left, y: bounds.top, w: halfW, h: halfH };
  }
  if (nearTop && nearRight) {
    return { type: "top-right", x: bounds.left + halfW, y: bounds.top, w: halfW, h: halfH };
  }
  if (nearBottom && nearLeft) {
    return { type: "bottom-left", x: bounds.left, y: bounds.top + halfH, w: halfW, h: halfH };
  }
  if (nearBottom && nearRight) {
    return { type: "bottom-right", x: bounds.left + halfW, y: bounds.top + halfH, w: halfW, h: halfH };
  }

  // Edges (half-screen or maximize)
  if (nearTop) {
    return { type: "top", x: bounds.left, y: bounds.top, w: bounds.width, h: bounds.height };
  }
  if (nearLeft) {
    return { type: "left", x: bounds.left, y: bounds.top, w: halfW, h: bounds.height };
  }
  if (nearRight) {
    return { type: "right", x: bounds.left + halfW, y: bounds.top, w: halfW, h: bounds.height };
  }

  return null;
};
