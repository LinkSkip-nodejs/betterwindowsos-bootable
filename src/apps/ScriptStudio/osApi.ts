export type ConsoleLine = {
  type: "log" | "error" | "warn" | "info" | "result";
  text: string;
  timestamp: number;
};

type FileEntry = {
  name: string;
  type: "file" | "folder";
  size: number;
};

type ProcessEntry = {
  pid: number;
  name: string;
  status: "running" | "sleeping" | "stopped";
  cpu: number;
  memory: number;
};

const mockFileSystem: Record<string, FileEntry[]> = {
  "/": [
    { name: "Desktop", type: "folder", size: 0 },
    { name: "Documents", type: "folder", size: 0 },
    { name: "Downloads", type: "folder", size: 0 },
    { name: "system.conf", type: "file", size: 2048 },
    { name: "README.md", type: "file", size: 512 },
  ],
  "/Desktop": [
    { name: "This PC", type: "folder", size: 0 },
    { name: "Recycle Bin", type: "folder", size: 0 },
    { name: "notes.txt", type: "file", size: 128 },
    { name: "screenshot.png", type: "file", size: 245760 },
  ],
  "/Documents": [
    { name: "report.pdf", type: "file", size: 1048576 },
    { name: "project", type: "folder", size: 0 },
    { name: "budget.xlsx", type: "file", size: 32768 },
  ],
  "/Downloads": [
    { name: "setup.exe", type: "file", size: 5242880 },
    { name: "photo.jpg", type: "file", size: 2097152 },
  ],
};

const mockProcesses: ProcessEntry[] = [
  { pid: 1, name: "system", status: "running", cpu: 0.5, memory: 12.4 },
  { pid: 42, name: "window-manager", status: "running", cpu: 2.1, memory: 45.8 },
  { pid: 88, name: "desktop-compositor", status: "running", cpu: 1.3, memory: 28.6 },
  { pid: 120, name: "notification-daemon", status: "sleeping", cpu: 0.0, memory: 8.2 },
  { pid: 156, name: "file-indexer", status: "running", cpu: 3.7, memory: 64.1 },
  { pid: 200, name: "network-manager", status: "running", cpu: 0.2, memory: 15.3 },
  { pid: 234, name: "audio-server", status: "running", cpu: 0.8, memory: 22.0 },
  { pid: 300, name: "script-studio", status: "running", cpu: 1.0, memory: 35.5 },
];

const bootTime = Date.now() - Math.floor(Math.random() * 3600000 + 1800000);

export function createOsApi(output: (line: ConsoleLine) => void) {
  const emit = (type: ConsoleLine["type"], text: string) => {
    output({ type, text, timestamp: Date.now() });
  };

  return {
    print: (...args: unknown[]) => {
      emit("log", args.map(String).join(" "));
    },

    warn: (...args: unknown[]) => {
      emit("warn", args.map(String).join(" "));
    },

    error: (...args: unknown[]) => {
      emit("error", args.map(String).join(" "));
    },

    info: (...args: unknown[]) => {
      emit("info", args.map(String).join(" "));
    },

    notify: (title: string, message: string, _type?: string) => {
      emit("info", `[Notification] ${title}: ${message}`);
    },

    sleep: (_ms: number) => {
      // In synchronous eval this is a no-op but we log it
      emit("info", `[sleep ${_ms}ms — simulated]`);
    },

    files: {
      list: (path: string): FileEntry[] => {
        const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
        const entries = mockFileSystem[normalized];
        if (!entries) {
          emit("error", `No such directory: ${path}`);
          return [];
        }
        return entries;
      },

      read: (path: string): string => {
        emit("info", `[read] ${path}`);
        if (path.endsWith(".conf")) return "# BetterWindowsOS System Config\ntheme=dark\nresolution=1920x1080";
        if (path.endsWith(".md")) return "# BetterWindowsOS\nA web-based desktop operating system.";
        if (path.endsWith(".txt")) return "Some sample text content for " + path;
        return `[binary data for ${path}]`;
      },

      write: (path: string, content: string): boolean => {
        emit("info", `[write] ${path} (${content.length} bytes)`);
        return true;
      },

      exists: (path: string): boolean => {
        const dir = path.replace(/\\/g, "/").replace(/\/[^/]+$/, "") || "/";
        const name = path.replace(/\\/g, "/").split("/").pop() ?? "";
        const entries = mockFileSystem[dir];
        return entries?.some((e) => e.name === name) ?? false;
      },

      mkdir: (path: string): boolean => {
        emit("info", `[mkdir] ${path}`);
        return true;
      },

      rm: (path: string): boolean => {
        emit("info", `[rm] ${path}`);
        return true;
      },
    },

    processes: {
      list: (): ProcessEntry[] => {
        return mockProcesses.map((p) => ({
          ...p,
          cpu: +(p.cpu + Math.random() * 0.5).toFixed(1),
          memory: +(p.memory + Math.random() * 2 - 1).toFixed(1),
        }));
      },

      kill: (pid: number): boolean => {
        const proc = mockProcesses.find((p) => p.pid === pid);
        if (!proc) {
          emit("error", `No process with PID ${pid}`);
          return false;
        }
        if (proc.pid === 1) {
          emit("error", "Cannot kill system process (PID 1)");
          return false;
        }
        emit("info", `[killed] PID ${pid} (${proc.name})`);
        return true;
      },
    },

    system: {
      info: () => ({
        name: "BetterWindowsOS",
        version: "3.0.0",
        build: "26000.3000",
        platform: navigator.platform,
        memory: `${Math.floor(Math.random() * 4 + 4)}GB / 16GB`,
        uptime: `${Math.floor((Date.now() - bootTime) / 60000)} minutes`,
        cores: navigator.hardwareConcurrency ?? 4,
      }),

      env: (key: string): string | undefined => {
        const env: Record<string, string> = {
          HOME: "/home/user",
          USER: "user",
          SHELL: "/bin/bwsh",
          PATH: "/usr/bin:/usr/local/bin",
          EDITOR: "notepad",
          LANG: "en_US.UTF-8",
        };
        return key ? env[key] : undefined;
      },

      hostname: () => "betterwinos-desktop",
      time: () => new Date().toISOString(),
    },

    math: {
      random: (min = 0, max = 1) => Math.random() * (max - min) + min,
      round: Math.round,
      floor: Math.floor,
      ceil: Math.ceil,
      abs: Math.abs,
      sqrt: Math.sqrt,
      pow: Math.pow,
      PI: Math.PI,
    },

    json: {
      parse: JSON.parse,
      stringify: (val: unknown) => JSON.stringify(val, null, 2),
    },
  };
}

export type OsApi = ReturnType<typeof createOsApi>;
