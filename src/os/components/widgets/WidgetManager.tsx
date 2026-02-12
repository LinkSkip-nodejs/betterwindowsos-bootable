import { useStore } from "../../state/store";
import { useDragResize } from "../../windowing/useDragResize";
import WeatherWidget from "./WeatherWidget";
import ClockWidget from "./ClockWidget";
import BatteryWidget from "./BatteryWidget";

const WidgetManager = () => {
  const widgets = useStore((s) => s.widgets);
  const moveWidget = useStore((s) => s.moveWidget);
  const removeWidget = useStore((s) => s.removeWidget);
  const { startDrag } = useDragResize();

  const renderWidget = (widget: any) => {
    switch (widget.type) {
      case "weather":
        return <WeatherWidget />;
      case "clock":
        return <ClockWidget />;
      case "battery":
        return <BatteryWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          className="absolute pointer-events-auto group"
          style={{ left: widget.x, top: widget.y }}
          onPointerDown={(e) => {
            startDrag(
              e,
              { x: widget.x, y: widget.y },
              {
                onMove: (x, y) => moveWidget(widget.id, x, y),
              }
            );
          }}
        >
          <div className="relative">
            <button
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] hidden group-hover:flex items-center justify-center shadow-lg z-10"
              onClick={(e) => {
                e.stopPropagation();
                removeWidget(widget.id);
              }}
            >
              ✕
            </button>
            {renderWidget(widget)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WidgetManager;
