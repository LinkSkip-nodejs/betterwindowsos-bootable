import { useState } from "react";

const BatteryWidget = () => {
  const [devices] = useState([
    { name: "My iPhone", level: 84, icon: "📱" },
    { name: "AirPods Pro", level: 45, icon: "🎧" },
    { name: "Keyboard", level: 100, icon: "⌨️" },
    { name: "Magic Mouse", level: 12, icon: "🖱️" },
  ]);

  return (
    <div className="w-56 p-4 rounded-3xl glass shadow-glass flex flex-col gap-3 select-none border border-white/10">
      <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold px-1">Connected Devices</div>
      <div className="space-y-3">
        {devices.map((device) => (
          <div key={device.name} className="flex items-center gap-3">
            <span className="text-xl">{device.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-white/80">{device.name}</span>
                <span className={device.level < 20 ? "text-red-400" : "text-white/60"}>{device.level}%</span>
              </div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    device.level < 20 ? "bg-red-500" : "bg-accent"
                  }`}
                  style={{ width: `${device.level}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatteryWidget;
