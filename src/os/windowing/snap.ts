export type SnapTarget =
  | { type: "left"; x: number; y: number; w: number; h: number }
  | { type: "right"; x: number; y: number; w: number; h: number }
  | { type: "top"; x: number; y: number; w: number; h: number }
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

  if (nearTop) {
    return {
      type: "top",
      x: bounds.left,
      y: bounds.top,
      w: bounds.width,
      h: bounds.height,
    };
  }

  if (nearLeft) {
    return {
      type: "left",
      x: bounds.left,
      y: bounds.top,
      w: bounds.width / 2,
      h: bounds.height,
    };
  }

  if (nearRight) {
    return {
      type: "right",
      x: bounds.left + bounds.width / 2,
      y: bounds.top,
      w: bounds.width / 2,
      h: bounds.height,
    };
  }

  return null;
};
