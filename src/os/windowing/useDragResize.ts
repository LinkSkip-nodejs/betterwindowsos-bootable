import { useRef } from "react";

type DragHandlers = {
  onMove: (x: number, y: number, clientX: number, clientY: number) => void;
  onDragEnd?: (clientX: number, clientY: number) => void;
  onDragStart?: () => void;
};

type ResizeHandlers = {
  onResize: (
    x: number,
    y: number,
    w: number,
    h: number,
    clientX: number,
    clientY: number
  ) => void;
  onResizeEnd?: () => void;
  onResizeStart?: () => void;
};

type ResizeDirection =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

export const useDragResize = () => {
  const frame = useRef<number>();

  const schedule = (cb: () => void) => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(cb);
  };

  const startDrag = (
    event: React.PointerEvent,
    initial: { x: number; y: number },
    handlers: DragHandlers
  ) => {
    event.preventDefault();
    handlers.onDragStart?.();
    const startX = event.clientX;
    const startY = event.clientY;

    const onMove = (moveEvent: PointerEvent) => {
      schedule(() => {
        const nextX = initial.x + (moveEvent.clientX - startX);
        const nextY = initial.y + (moveEvent.clientY - startY);
        handlers.onMove(nextX, nextY, moveEvent.clientX, moveEvent.clientY);
      });
    };

    const onUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      handlers.onDragEnd?.(upEvent.clientX, upEvent.clientY);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startResize = (
    event: React.PointerEvent,
    direction: ResizeDirection,
    initial: { x: number; y: number; w: number; h: number },
    handlers: ResizeHandlers
  ) => {
    event.preventDefault();
    handlers.onResizeStart?.();
    const startX = event.clientX;
    const startY = event.clientY;

    const onMove = (moveEvent: PointerEvent) => {
      schedule(() => {
        let { x, y, w, h } = initial;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        if (direction.includes("e")) w = initial.w + dx;
        if (direction.includes("s")) h = initial.h + dy;
        if (direction.includes("w")) {
          w = initial.w - dx;
          x = initial.x + dx;
        }
        if (direction.includes("n")) {
          h = initial.h - dy;
          y = initial.y + dy;
        }

        handlers.onResize(x, y, w, h, moveEvent.clientX, moveEvent.clientY);
      });
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      handlers.onResizeEnd?.();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return { startDrag, startResize };
};
