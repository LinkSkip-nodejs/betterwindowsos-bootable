const STORAGE_KEY = "bwos-scripts";

export type SavedScript = {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  updatedAt: number;
};

export type PreloadedScript = {
  name: string;
  code: string;
  category: string;
};

let idCounter = 0;
const nextId = () => `script-${Date.now()}-${++idCounter}`;

export function loadScripts(): SavedScript[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(scripts: SavedScript[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
}

export function saveScript(name: string, code: string, existingId?: string): SavedScript {
  const scripts = loadScripts();
  const now = Date.now();

  if (existingId) {
    const idx = scripts.findIndex((s) => s.id === existingId);
    if (idx >= 0) {
      scripts[idx] = { ...scripts[idx], name, code, updatedAt: now };
      persist(scripts);
      return scripts[idx];
    }
  }

  const script: SavedScript = { id: nextId(), name, code, createdAt: now, updatedAt: now };
  scripts.unshift(script);
  persist(scripts);
  return script;
}

export function deleteScript(id: string) {
  const scripts = loadScripts().filter((s) => s.id !== id);
  persist(scripts);
}

/* ── 100 Preloaded Scripts ───────────────────────────────── */

export const defaultScripts: PreloadedScript[] = [
  // ═══════════════════════════════════════════
  // BASICS (1-10)
  // ═══════════════════════════════════════════
  {
    category: "Basics",
    name: "Hello World",
    code: `os.print("Hello from BetterWindowsOS!");
os.print("Welcome to Script Studio.");`,
  },
  {
    category: "Basics",
    name: "Current Time",
    code: `const now = new Date();
os.print("Date: " + now.toLocaleDateString());
os.print("Time: " + now.toLocaleTimeString());
os.print("Timestamp: " + now.getTime());`,
  },
  {
    category: "Basics",
    name: "Variables & Types",
    code: `const name = "BetterWindowsOS";
const version = 3.0;
const features = ["windowing", "filesystem", "networking"];
const active = true;

os.print("Name: " + name + " (string)");
os.print("Version: " + version + " (number)");
os.print("Features: " + features.join(", ") + " (array)");
os.print("Active: " + active + " (boolean)");`,
  },
  {
    category: "Basics",
    name: "Loops Demo",
    code: `os.print("=== For Loop ===");
for (let i = 1; i <= 5; i++) {
  os.print("  Iteration " + i);
}

os.print("\\n=== While Loop ===");
let count = 0;
while (count < 3) {
  os.print("  Count: " + count);
  count++;
}

os.print("\\n=== For...of ===");
const colors = ["red", "green", "blue", "yellow"];
for (const color of colors) {
  os.print("  Color: " + color);
}`,
  },
  {
    category: "Basics",
    name: "Functions",
    code: `function greet(name) {
  return "Hello, " + name + "!";
}

function add(a, b) {
  return a + b;
}

function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

os.print(greet("User"));
os.print("2 + 3 = " + add(2, 3));
os.print("5! = " + factorial(5));
os.print("10! = " + factorial(10));`,
  },
  {
    category: "Basics",
    name: "String Methods",
    code: `const str = "BetterWindowsOS is awesome";

os.print("Original: " + str);
os.print("Upper: " + str.toUpperCase());
os.print("Lower: " + str.toLowerCase());
os.print("Length: " + str.length);
os.print("Includes 'OS': " + str.includes("OS"));
os.print("Replace: " + str.replace("awesome", "incredible"));
os.print("Split: " + os.json.stringify(str.split(" ")));
os.print("Slice(0,6): " + str.slice(0, 6));
os.print("Trim: '" + "  hello  ".trim() + "'");
os.print("Repeat: " + "ha".repeat(3));`,
  },
  {
    category: "Basics",
    name: "Array Methods",
    code: `const nums = [5, 3, 8, 1, 9, 2, 7, 4, 6];

os.print("Original: " + nums.join(", "));
os.print("Sorted: " + [...nums].sort((a, b) => a - b).join(", "));
os.print("Reversed: " + [...nums].reverse().join(", "));
os.print("Filtered (>5): " + nums.filter(n => n > 5).join(", "));
os.print("Mapped (*2): " + nums.map(n => n * 2).join(", "));
os.print("Sum: " + nums.reduce((a, b) => a + b, 0));
os.print("Min: " + Math.min(...nums));
os.print("Max: " + Math.max(...nums));
os.print("Includes 7: " + nums.includes(7));
os.print("Index of 8: " + nums.indexOf(8));`,
  },
  {
    category: "Basics",
    name: "Object Operations",
    code: `const user = {
  name: "Admin",
  role: "System Administrator",
  level: 10,
  permissions: ["read", "write", "execute", "admin"]
};

os.print("=== User Object ===");
os.print("Keys: " + Object.keys(user).join(", "));
os.print("Values: " + Object.values(user).join(", "));

for (const [key, val] of Object.entries(user)) {
  os.print("  " + key + ": " + val);
}

const clone = { ...user, level: 11 };
os.print("\\nCloned with level 11: " + os.json.stringify(clone));`,
  },
  {
    category: "Basics",
    name: "Error Handling",
    code: `os.print("=== Try/Catch Demo ===");

try {
  os.print("Attempting risky operation...");
  const result = JSON.parse("not valid json");
  os.print("Result: " + result);
} catch (err) {
  os.error("Caught error: " + err.message);
}

os.print("\\n=== Custom Error ===");
try {
  throw new Error("Custom error from script");
} catch (err) {
  os.warn("Handled: " + err.message);
}

os.print("\\nScript continued after errors!");`,
  },
  {
    category: "Basics",
    name: "Destructuring",
    code: `// Array destructuring
const [first, second, ...rest] = [1, 2, 3, 4, 5];
os.print("First: " + first);
os.print("Second: " + second);
os.print("Rest: " + rest.join(", "));

// Object destructuring
const { name, version, build } = os.system.info();
os.print("\\nOS: " + name);
os.print("Version: " + version);
os.print("Build: " + build);

// Swap
let a = "hello", b = "world";
[a, b] = [b, a];
os.print("\\nSwapped: " + a + ", " + b);`,
  },

  // ═══════════════════════════════════════════
  // SYSTEM (11-20)
  // ═══════════════════════════════════════════
  {
    category: "System",
    name: "System Info",
    code: `const info = os.system.info();
os.print("╔══════════════════════════╗");
os.print("║     SYSTEM INFORMATION   ║");
os.print("╚══════════════════════════╝");
os.print("OS:       " + info.name);
os.print("Version:  " + info.version);
os.print("Build:    " + info.build);
os.print("Platform: " + info.platform);
os.print("Memory:   " + info.memory);
os.print("Cores:    " + info.cores);
os.print("Uptime:   " + info.uptime);
os.print("Hostname: " + os.system.hostname());
os.print("Time:     " + os.system.time());`,
  },
  {
    category: "System",
    name: "Environment Variables",
    code: `const vars = ["HOME", "USER", "SHELL", "PATH", "EDITOR", "LANG"];

os.print("=== Environment Variables ===");
vars.forEach(v => {
  const val = os.system.env(v);
  os.print("  $" + v + " = " + (val || "(not set)"));
});`,
  },
  {
    category: "System",
    name: "Process Manager",
    code: `const procs = os.processes.list();
os.print("PID   NAME                  STATUS     CPU%   MEM MB");
os.print("─".repeat(60));
procs.forEach(p => {
  const pid = String(p.pid).padEnd(6);
  const name = p.name.padEnd(22);
  const status = p.status.padEnd(11);
  const cpu = String(p.cpu + "%").padEnd(7);
  os.print(pid + name + status + cpu + p.memory);
});
os.print("─".repeat(60));
os.print("Total: " + procs.length + " processes");
const totalCpu = procs.reduce((a, p) => a + p.cpu, 0).toFixed(1);
const totalMem = procs.reduce((a, p) => a + p.memory, 0).toFixed(1);
os.print("Total CPU: " + totalCpu + "%  Memory: " + totalMem + " MB");`,
  },
  {
    category: "System",
    name: "Kill a Process",
    code: `const procs = os.processes.list();
os.print("Running processes:");
procs.forEach(p => os.print("  [" + p.pid + "] " + p.name));

os.print("\\nAttempting to kill file-indexer (PID 156)...");
const result = os.processes.kill(156);
os.print("Kill result: " + (result ? "Success" : "Failed"));

os.print("\\nAttempting to kill system (PID 1)...");
os.processes.kill(1);`,
  },
  {
    category: "System",
    name: "CPU Monitor",
    code: `os.print("=== CPU Usage Snapshot ===\\n");
const procs = os.processes.list();
const sorted = [...procs].sort((a, b) => b.cpu - a.cpu);

sorted.forEach(p => {
  const barLen = Math.round(p.cpu * 5);
  const bar = "█".repeat(barLen) + "░".repeat(25 - barLen);
  os.print(p.name.padEnd(22) + " [" + bar + "] " + p.cpu + "%");
});

const total = procs.reduce((a, p) => a + p.cpu, 0);
os.print("\\nTotal CPU: " + total.toFixed(1) + "%");
if (total > 8) os.warn("High CPU usage detected!");`,
  },
  {
    category: "System",
    name: "Memory Report",
    code: `const procs = os.processes.list();
const sorted = [...procs].sort((a, b) => b.memory - a.memory);
const total = sorted.reduce((a, p) => a + p.memory, 0);

os.print("=== Memory Usage Report ===\\n");
sorted.forEach(p => {
  const pct = ((p.memory / total) * 100).toFixed(1);
  const barLen = Math.round(p.memory / total * 30);
  const bar = "▓".repeat(barLen) + "░".repeat(30 - barLen);
  os.print(p.name.padEnd(22) + bar + " " + p.memory + "MB (" + pct + "%)");
});
os.print("\\nTotal: " + total.toFixed(1) + " MB");`,
  },
  {
    category: "System",
    name: "Uptime Calculator",
    code: `const info = os.system.info();
const uptimeMin = parseInt(info.uptime);
const hours = Math.floor(uptimeMin / 60);
const minutes = uptimeMin % 60;
const days = Math.floor(hours / 24);

os.print("=== Uptime Report ===");
os.print("Raw: " + info.uptime);
if (days > 0) os.print("Days: " + days);
os.print("Hours: " + (hours % 24));
os.print("Minutes: " + minutes);
os.print("Total seconds: " + (uptimeMin * 60));

if (uptimeMin > 60) {
  os.info("System has been running for over an hour");
}`,
  },
  {
    category: "System",
    name: "Hostname & Network",
    code: `os.print("=== Network Information ===");
os.print("Hostname: " + os.system.hostname());
os.print("Server time: " + os.system.time());
os.print("User: " + os.system.env("USER"));
os.print("Shell: " + os.system.env("SHELL"));
os.print("Language: " + os.system.env("LANG"));

os.print("\\n=== Connectivity Test ===");
os.print("Testing connection... OK");
os.notify("Network", "Connectivity check passed");`,
  },
  {
    category: "System",
    name: "Boot Diagnostics",
    code: `os.print("╔══════════════════════════════════╗");
os.print("║     BOOT DIAGNOSTICS REPORT      ║");
os.print("╚══════════════════════════════════╝\\n");

os.print("[OK] Kernel loaded");
os.print("[OK] Filesystem mounted");
os.print("[OK] Network manager started");
os.print("[OK] Desktop compositor active");

const procs = os.processes.list();
const running = procs.filter(p => p.status === "running").length;
const sleeping = procs.filter(p => p.status === "sleeping").length;

os.print("\\n[INFO] Processes: " + running + " running, " + sleeping + " sleeping");

const info = os.system.info();
os.print("[INFO] Memory: " + info.memory);
os.print("[INFO] Cores: " + info.cores);
os.print("\\nAll systems nominal.");`,
  },
  {
    category: "System",
    name: "System Health Check",
    code: `os.print("Running system health check...\\n");
let score = 100;
const issues = [];

const procs = os.processes.list();
const totalCpu = procs.reduce((a, p) => a + p.cpu, 0);
const totalMem = procs.reduce((a, p) => a + p.memory, 0);

if (totalCpu > 10) { score -= 20; issues.push("High CPU usage: " + totalCpu.toFixed(1) + "%"); }
if (totalMem > 200) { score -= 15; issues.push("High memory usage: " + totalMem.toFixed(1) + "MB"); }

const stoppedProcs = procs.filter(p => p.status === "stopped");
if (stoppedProcs.length > 0) {
  score -= 10;
  issues.push(stoppedProcs.length + " stopped processes");
}

if (issues.length === 0) {
  os.print("✓ All checks passed!");
} else {
  issues.forEach(i => os.warn("! " + i));
}

os.print("\\nHealth Score: " + score + "/100");
if (score >= 80) os.print("Status: HEALTHY");
else if (score >= 50) os.warn("Status: DEGRADED");
else os.error("Status: CRITICAL");`,
  },

  // ═══════════════════════════════════════════
  // FILES (21-35)
  // ═══════════════════════════════════════════
  {
    category: "Files",
    name: "List Root Directory",
    code: `const files = os.files.list("/");
os.print("=== Root Directory ===");
files.forEach(f => {
  const icon = f.type === "folder" ? "📁" : "📄";
  const size = f.size > 0 ? " (" + (f.size / 1024).toFixed(1) + " KB)" : "";
  os.print("  " + icon + " " + f.name + size);
});
os.print("\\nTotal: " + files.length + " items");`,
  },
  {
    category: "Files",
    name: "List All Directories",
    code: `const dirs = ["/", "/Desktop", "/Documents", "/Downloads"];
dirs.forEach(dir => {
  const files = os.files.list(dir);
  os.print("\\n=== " + dir + " (" + files.length + " items) ===");
  files.forEach(f => {
    const icon = f.type === "folder" ? "📁" : "📄";
    os.print("  " + icon + " " + f.name);
  });
});`,
  },
  {
    category: "Files",
    name: "Desktop Contents",
    code: `const files = os.files.list("/Desktop");
os.print("Desktop:");
const folders = files.filter(f => f.type === "folder");
const regular = files.filter(f => f.type === "file");

os.print("\\n  Folders (" + folders.length + "):");
folders.forEach(f => os.print("    📁 " + f.name));

os.print("\\n  Files (" + regular.length + "):");
regular.forEach(f => {
  const sizeStr = f.size >= 1024 ? (f.size / 1024).toFixed(1) + " KB" : f.size + " B";
  os.print("    📄 " + f.name + " (" + sizeStr + ")");
});`,
  },
  {
    category: "Files",
    name: "Read Config File",
    code: `os.print("Reading system.conf...\\n");
const content = os.files.read("/system.conf");
os.print(content);

os.print("\\n--- Parsing config ---");
content.split("\\n").forEach(line => {
  if (line.startsWith("#")) return;
  const [key, val] = line.split("=");
  if (key && val) {
    os.print("  " + key.trim() + " => " + val.trim());
  }
});`,
  },
  {
    category: "Files",
    name: "Read README",
    code: `os.print("Reading README.md...\\n");
const content = os.files.read("/README.md");
const lines = content.split("\\n");
lines.forEach(line => {
  if (line.startsWith("# ")) {
    os.print(">>> " + line.slice(2).toUpperCase() + " <<<");
  } else {
    os.print("  " + line);
  }
});`,
  },
  {
    category: "Files",
    name: "File Search",
    code: `const searchTerm = "txt";
os.print("Searching for '*." + searchTerm + "' across all directories...\\n");

const dirs = ["/", "/Desktop", "/Documents", "/Downloads"];
let found = 0;
dirs.forEach(dir => {
  const files = os.files.list(dir);
  files.forEach(f => {
    if (f.name.includes(searchTerm)) {
      os.print("  Found: " + dir + "/" + f.name);
      found++;
    }
  });
});

os.print("\\n" + found + " match(es) found.");`,
  },
  {
    category: "Files",
    name: "Disk Usage Report",
    code: `os.print("=== Disk Usage Report ===\\n");
const dirs = ["/", "/Desktop", "/Documents", "/Downloads"];
let grandTotal = 0;

dirs.forEach(dir => {
  const files = os.files.list(dir);
  const dirSize = files.reduce((a, f) => a + f.size, 0);
  grandTotal += dirSize;
  const sizeStr = dirSize >= 1048576
    ? (dirSize / 1048576).toFixed(2) + " MB"
    : (dirSize / 1024).toFixed(1) + " KB";
  os.print(dir.padEnd(15) + sizeStr);
});

os.print("─".repeat(30));
const totalStr = grandTotal >= 1048576
  ? (grandTotal / 1048576).toFixed(2) + " MB"
  : (grandTotal / 1024).toFixed(1) + " KB";
os.print("TOTAL".padEnd(15) + totalStr);`,
  },
  {
    category: "Files",
    name: "File Type Counter",
    code: `const dirs = ["/", "/Desktop", "/Documents", "/Downloads"];
const extensions = {};
let totalFiles = 0;
let totalFolders = 0;

dirs.forEach(dir => {
  os.files.list(dir).forEach(f => {
    if (f.type === "folder") { totalFolders++; return; }
    totalFiles++;
    const ext = f.name.includes(".") ? f.name.split(".").pop() : "no-ext";
    extensions[ext] = (extensions[ext] || 0) + 1;
  });
});

os.print("=== File Type Summary ===");
os.print("Folders: " + totalFolders);
os.print("Files: " + totalFiles);
os.print("\\nBy extension:");
Object.entries(extensions)
  .sort((a, b) => b[1] - a[1])
  .forEach(([ext, count]) => {
    os.print("  ." + ext + ": " + count + " file(s)");
  });`,
  },
  {
    category: "Files",
    name: "Write File",
    code: `const filename = "/Documents/hello.txt";
const content = "Hello from Script Studio!\\nWritten at " + new Date().toLocaleString();

os.print("Writing to " + filename + "...");
const ok = os.files.write(filename, content);
os.print("Result: " + (ok ? "Success" : "Failed"));

os.print("\\nReading back...");
os.print(os.files.read(filename));`,
  },
  {
    category: "Files",
    name: "Create Directory",
    code: `os.print("Creating directory structure...\\n");
os.files.mkdir("/Documents/project");
os.files.mkdir("/Documents/project/src");
os.files.mkdir("/Documents/project/docs");

os.print("Writing project files...");
os.files.write("/Documents/project/README.md", "# My Project");
os.files.write("/Documents/project/src/main.js", "console.log('hello')");

os.print("\\nProject structure created!");
os.print("  📁 project/");
os.print("    📁 src/");
os.print("      📄 main.js");
os.print("    📁 docs/");
os.print("    📄 README.md");`,
  },
  {
    category: "Files",
    name: "File Exists Check",
    code: `const paths = [
  "/system.conf",
  "/README.md",
  "/nonexistent.txt",
  "/Desktop/notes.txt",
  "/Desktop/missing.doc"
];

os.print("=== File Existence Check ===\\n");
paths.forEach(path => {
  const exists = os.files.exists(path);
  const icon = exists ? "✓" : "✗";
  const style = exists ? os.print : os.warn;
  style(icon + " " + path + " — " + (exists ? "EXISTS" : "NOT FOUND"));
});`,
  },
  {
    category: "Files",
    name: "Delete Files",
    code: `os.print("=== File Cleanup Script ===\\n");

const targets = ["/tmp/cache.dat", "/tmp/logs.old", "/tmp/session.tmp"];
targets.forEach(f => {
  os.print("Removing " + f + "...");
  os.files.rm(f);
});

os.print("\\nCleanup complete! " + targets.length + " files removed.");
os.notify("Cleanup", "Temporary files cleared");`,
  },
  {
    category: "Files",
    name: "Largest Files",
    code: `const dirs = ["/", "/Desktop", "/Documents", "/Downloads"];
const allFiles = [];

dirs.forEach(dir => {
  os.files.list(dir).forEach(f => {
    if (f.type === "file") {
      allFiles.push({ path: dir + "/" + f.name, size: f.size });
    }
  });
});

allFiles.sort((a, b) => b.size - a.size);

os.print("=== Top 10 Largest Files ===\\n");
allFiles.slice(0, 10).forEach((f, i) => {
  const sizeStr = f.size >= 1048576
    ? (f.size / 1048576).toFixed(2) + " MB"
    : (f.size / 1024).toFixed(1) + " KB";
  os.print((i + 1) + ". " + f.path.padEnd(30) + sizeStr);
});`,
  },
  {
    category: "Files",
    name: "Backup Script",
    code: `os.print("=== Backup Script ===\\n");

const source = "/Documents";
const files = os.files.list(source);
os.print("Source: " + source + " (" + files.length + " items)");

os.files.mkdir("/Backups");
os.files.mkdir("/Backups/" + new Date().toISOString().slice(0, 10));

let backed = 0;
files.forEach(f => {
  if (f.type === "file") {
    const content = os.files.read(source + "/" + f.name);
    os.files.write("/Backups/" + f.name, content);
    os.print("  Backed up: " + f.name);
    backed++;
  }
});

os.print("\\n" + backed + " files backed up.");
os.notify("Backup", "Backup complete: " + backed + " files");`,
  },
  {
    category: "Files",
    name: "File Permissions",
    code: `const files = os.files.list("/");
os.print("=== Simulated File Permissions ===\\n");
os.print("MODE       SIZE      NAME");
os.print("─".repeat(40));
files.forEach(f => {
  const mode = f.type === "folder" ? "drwxr-xr-x" : "-rw-r--r--";
  const size = String(f.size).padStart(8);
  os.print(mode + " " + size + "  " + f.name);
});`,
  },

  // ═══════════════════════════════════════════
  // MATH & ALGORITHMS (36-50)
  // ═══════════════════════════════════════════
  {
    category: "Math",
    name: "Calculator",
    code: `function calc(expr) {
  const ops = { "+": (a,b)=>a+b, "-": (a,b)=>a-b, "*": (a,b)=>a*b, "/": (a,b)=>a/b };
  const [a, op, b] = expr.split(" ");
  if (ops[op]) return ops[op](parseFloat(a), parseFloat(b));
  return NaN;
}

const expressions = ["10 + 5", "100 - 37", "8 * 12", "144 / 12", "3.14 * 2"];
os.print("=== Calculator ===\\n");
expressions.forEach(e => {
  os.print("  " + e + " = " + calc(e));
});`,
  },
  {
    category: "Math",
    name: "Fibonacci Sequence",
    code: `function fibonacci(n) {
  const seq = [0, 1];
  for (let i = 2; i < n; i++) {
    seq.push(seq[i-1] + seq[i-2]);
  }
  return seq;
}

const fib = fibonacci(20);
os.print("First 20 Fibonacci numbers:");
os.print(fib.join(", "));
os.print("\\nSum: " + fib.reduce((a,b) => a+b, 0));
os.print("Golden ratio approx: " + (fib[19] / fib[18]).toFixed(10));`,
  },
  {
    category: "Math",
    name: "Prime Numbers",
    code: `function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

const primes = [];
for (let i = 2; i <= 100; i++) {
  if (isPrime(i)) primes.push(i);
}

os.print("Primes up to 100:");
os.print(primes.join(", "));
os.print("\\nCount: " + primes.length);
os.print("Sum: " + primes.reduce((a,b) => a+b, 0));`,
  },
  {
    category: "Math",
    name: "Sorting Algorithms",
    code: `function bubbleSort(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < a.length - i - 1; j++)
      if (a[j] > a[j+1]) [a[j], a[j+1]] = [a[j+1], a[j]];
  return a;
}

function selectionSort(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    let min = i;
    for (let j = i+1; j < a.length; j++) if (a[j] < a[min]) min = j;
    [a[i], a[min]] = [a[min], a[i]];
  }
  return a;
}

const data = [64, 34, 25, 12, 22, 11, 90, 45, 78, 3];
os.print("Input:     " + data.join(", "));
os.print("Bubble:    " + bubbleSort(data).join(", "));
os.print("Selection: " + selectionSort(data).join(", "));
os.print("Native:    " + [...data].sort((a,b) => a-b).join(", "));`,
  },
  {
    category: "Math",
    name: "Binary Search",
    code: `function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1, steps = 0;
  while (lo <= hi) {
    steps++;
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return { found: true, index: mid, steps };
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return { found: false, index: -1, steps };
}

const sorted = Array.from({length: 100}, (_, i) => i * 2);
os.print("Array: 0, 2, 4, ... 198 (100 elements)\\n");

[42, 77, 150, 0, 198].forEach(target => {
  const r = binarySearch(sorted, target);
  if (r.found) os.print("Found " + target + " at index " + r.index + " in " + r.steps + " steps");
  else os.warn(target + " not found (" + r.steps + " steps)");
});`,
  },
  {
    category: "Math",
    name: "Statistics",
    code: `const data = [23, 45, 12, 67, 34, 89, 21, 56, 78, 43, 65, 32, 54, 76, 98, 11, 87, 39];

function mean(arr) { return arr.reduce((a,b) => a+b, 0) / arr.length; }
function median(arr) {
  const s = [...arr].sort((a,b) => a-b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m-1] + s[m]) / 2;
}
function stdDev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a,v) => a + (v-m)**2, 0) / arr.length);
}

os.print("=== Statistical Analysis ===");
os.print("Data: " + data.join(", "));
os.print("Count: " + data.length);
os.print("Mean: " + mean(data).toFixed(2));
os.print("Median: " + median(data));
os.print("Std Dev: " + stdDev(data).toFixed(2));
os.print("Min: " + Math.min(...data));
os.print("Max: " + Math.max(...data));
os.print("Range: " + (Math.max(...data) - Math.min(...data)));`,
  },
  {
    category: "Math",
    name: "Matrix Operations",
    code: `function printMatrix(name, m) {
  os.print(name + ":");
  m.forEach(row => os.print("  [" + row.map(v => String(v).padStart(4)).join(",") + " ]"));
}

function multiply(a, b) {
  const rows = a.length, cols = b[0].length, n = b.length;
  const result = Array.from({length: rows}, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < cols; j++)
      for (let k = 0; k < n; k++)
        result[i][j] += a[i][k] * b[k][j];
  return result;
}

const A = [[1,2],[3,4]];
const B = [[5,6],[7,8]];
printMatrix("A", A);
printMatrix("B", B);
printMatrix("A × B", multiply(A, B));`,
  },
  {
    category: "Math",
    name: "Pi Estimator",
    code: `os.print("Estimating Pi using Monte Carlo method...\\n");

function estimatePi(samples) {
  let inside = 0;
  for (let i = 0; i < samples; i++) {
    const x = Math.random();
    const y = Math.random();
    if (x*x + y*y <= 1) inside++;
  }
  return 4 * inside / samples;
}

[100, 1000, 10000, 100000].forEach(n => {
  const est = estimatePi(n);
  const error = Math.abs(est - Math.PI);
  os.print("n=" + String(n).padEnd(8) + "Pi≈" + est.toFixed(6) + "  error=" + error.toFixed(6));
});

os.print("\\nActual Pi: " + Math.PI.toFixed(10));`,
  },
  {
    category: "Math",
    name: "Number Base Converter",
    code: `function convert(num) {
  os.print("Decimal:     " + num);
  os.print("Binary:      " + num.toString(2));
  os.print("Octal:       " + num.toString(8));
  os.print("Hexadecimal: " + num.toString(16).toUpperCase());
  os.print("");
}

os.print("=== Number Base Converter ===\\n");
[42, 255, 1024, 65535, 12345].forEach(convert);`,
  },
  {
    category: "Math",
    name: "GCD & LCM",
    code: `function gcd(a, b) {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

const pairs = [[12, 18], [35, 49], [100, 75], [17, 13], [144, 60]];

os.print("=== GCD & LCM Calculator ===\\n");
pairs.forEach(([a, b]) => {
  os.print("gcd(" + a + ", " + b + ") = " + gcd(a, b) + "   lcm(" + a + ", " + b + ") = " + lcm(a, b));
});`,
  },
  {
    category: "Math",
    name: "Collatz Conjecture",
    code: `function collatz(n) {
  const seq = [n];
  while (n !== 1) {
    n = n % 2 === 0 ? n / 2 : 3 * n + 1;
    seq.push(n);
  }
  return seq;
}

[7, 27, 97, 871].forEach(start => {
  const seq = collatz(start);
  os.print("Start: " + start + " — " + seq.length + " steps");
  os.print("  " + seq.slice(0, 15).join(" → ") + (seq.length > 15 ? " → ..." : ""));
  os.print("  Max value reached: " + Math.max(...seq));
  os.print("");
});`,
  },
  {
    category: "Math",
    name: "Temperature Converter",
    code: `function cToF(c) { return (c * 9/5) + 32; }
function fToC(f) { return (f - 32) * 5/9; }
function cToK(c) { return c + 273.15; }

os.print("=== Temperature Converter ===\\n");
os.print("°C".padEnd(8) + "°F".padEnd(10) + "K");
os.print("─".repeat(26));
[-40, -20, 0, 20, 37, 100, 212].forEach(c => {
  os.print(
    (c + "°C").padEnd(8) +
    (cToF(c).toFixed(1) + "°F").padEnd(10) +
    cToK(c).toFixed(2) + "K"
  );
});`,
  },
  {
    category: "Math",
    name: "Permutations",
    code: `function permute(arr) {
  if (arr.length <= 1) return [arr];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permute(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

const items = ["A", "B", "C"];
const perms = permute(items);
os.print("Permutations of [" + items.join(", ") + "]:\\n");
perms.forEach((p, i) => os.print("  " + (i+1) + ". " + p.join(", ")));
os.print("\\nTotal: " + perms.length);`,
  },
  {
    category: "Math",
    name: "Histogram Generator",
    code: `const data = [];
for (let i = 0; i < 200; i++) {
  data.push(Math.floor(Math.random() * 10));
}

const freq = {};
data.forEach(v => freq[v] = (freq[v] || 0) + 1);

os.print("=== Histogram (200 random values 0-9) ===\\n");
for (let i = 0; i <= 9; i++) {
  const count = freq[i] || 0;
  const bar = "█".repeat(count);
  os.print(i + " │ " + bar + " (" + count + ")");
}
os.print("  └" + "─".repeat(35));`,
  },
  {
    category: "Math",
    name: "Roman Numerals",
    code: `function toRoman(num) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ["M","CM","D","CD","C","XC","L","XL","X","IX","V","IV","I"];
  let result = "";
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
}

os.print("=== Roman Numeral Converter ===\\n");
[1, 4, 9, 14, 42, 99, 399, 1024, 1999, 2024, 3999].forEach(n => {
  os.print("  " + String(n).padEnd(6) + "= " + toRoman(n));
});`,
  },

  // ═══════════════════════════════════════════
  // TEXT & DATA (51-65)
  // ═══════════════════════════════════════════
  {
    category: "Text",
    name: "Word Counter",
    code: `const text = "The quick brown fox jumps over the lazy dog. The dog barked at the fox. The fox ran away quickly.";

const words = text.split(/\\s+/);
const freq = {};
words.forEach(w => {
  const clean = w.toLowerCase().replace(/[^a-z]/g, "");
  if (clean) freq[clean] = (freq[clean] || 0) + 1;
});

os.print("Text: \\"" + text + "\\"\\n");
os.print("Words: " + words.length);
os.print("Unique: " + Object.keys(freq).length);
os.print("\\nWord frequency:");
Object.entries(freq)
  .sort((a, b) => b[1] - a[1])
  .forEach(([word, count]) => {
    os.print("  " + word.padEnd(10) + "× " + count);
  });`,
  },
  {
    category: "Text",
    name: "Caesar Cipher",
    code: `function caesar(text, shift) {
  return text.split("").map(ch => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90)
      return String.fromCharCode(((code - 65 + shift) % 26 + 26) % 26 + 65);
    if (code >= 97 && code <= 122)
      return String.fromCharCode(((code - 97 + shift) % 26 + 26) % 26 + 97);
    return ch;
  }).join("");
}

const message = "Hello BetterWindowsOS";
os.print("Original:  " + message);
os.print("Shift +3:  " + caesar(message, 3));
os.print("Shift +13: " + caesar(message, 13));
os.print("Decoded:   " + caesar(caesar(message, 13), 13));`,
  },
  {
    category: "Text",
    name: "Palindrome Checker",
    code: `function isPalindrome(str) {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === clean.split("").reverse().join("");
}

const tests = [
  "racecar", "hello", "A man a plan a canal Panama",
  "Was it a car or a cat I saw", "not a palindrome",
  "Never odd or even", "12321", "kayak"
];

os.print("=== Palindrome Checker ===\\n");
tests.forEach(t => {
  const result = isPalindrome(t);
  os.print((result ? "✓" : "✗") + ' "' + t + '"');
});`,
  },
  {
    category: "Text",
    name: "ASCII Art Generator",
    code: `const letters = {
  B: ["████ ","█   █","████ ","█   █","████ "],
  W: ["█   █","█   █","█ █ █","██ ██","█   █"],
  O: [" ███ ","█   █","█   █","█   █"," ███ "],
  S: [" ████","█    "," ███ ","    █","████ "]
};

os.print("=== ASCII Art ===\\n");
for (let row = 0; row < 5; row++) {
  let line = "";
  for (const ch of "BWOS") {
    line += (letters[ch] ? letters[ch][row] : "     ") + "  ";
  }
  os.print(line);
}`,
  },
  {
    category: "Text",
    name: "Password Generator",
    code: `function generatePassword(length, options) {
  let chars = "";
  if (options.lower) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.digits) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=";

  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

os.print("=== Password Generator ===\\n");
for (let i = 0; i < 5; i++) {
  os.print("  " + generatePassword(16, { lower: true, upper: true, digits: true, symbols: true }));
}
os.print("\\nPIN codes:");
for (let i = 0; i < 3; i++) {
  os.print("  " + generatePassword(6, { lower: false, upper: false, digits: true, symbols: false }));
}`,
  },
  {
    category: "Text",
    name: "JSON Formatter",
    code: `const ugly = '{"name":"BetterWindowsOS","version":3,"features":["windowing","filesystem","apps"],"config":{"theme":"dark","accent":"blue"}}';

os.print("=== JSON Formatter ===\\n");
os.print("Input:");
os.print(ugly);

os.print("\\nFormatted:");
const parsed = os.json.parse(ugly);
os.print(os.json.stringify(parsed));`,
  },
  {
    category: "Text",
    name: "Anagram Detector",
    code: `function isAnagram(a, b) {
  const normalize = s => s.toLowerCase().replace(/[^a-z]/g, "").split("").sort().join("");
  return normalize(a) === normalize(b);
}

const pairs = [
  ["listen", "silent"],
  ["hello", "world"],
  ["astronomer", "moon starer"],
  ["funeral", "real fun"],
  ["script", "studio"]
];

os.print("=== Anagram Detector ===\\n");
pairs.forEach(([a, b]) => {
  const result = isAnagram(a, b);
  os.print((result ? "✓" : "✗") + ' "' + a + '" / "' + b + '"');
});`,
  },
  {
    category: "Text",
    name: "Text Reverser",
    code: `function reverseWords(str) { return str.split(" ").reverse().join(" "); }
function reverseChars(str) { return str.split("").reverse().join(""); }
function titleCase(str) { return str.split(" ").map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" "); }

const text = "better windows operating system";
os.print("Original:      " + text);
os.print("Reverse chars: " + reverseChars(text));
os.print("Reverse words: " + reverseWords(text));
os.print("Title case:    " + titleCase(text));
os.print("UPPER:         " + text.toUpperCase());
os.print("Char count:    " + text.replace(/ /g, "").length);`,
  },
  {
    category: "Text",
    name: "Lorem Ipsum Generator",
    code: `const words = ["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris"];

function sentence() {
  const len = Math.floor(Math.random() * 8) + 5;
  const s = [];
  for (let i = 0; i < len; i++) {
    s.push(words[Math.floor(Math.random() * words.length)]);
  }
  s[0] = s[0][0].toUpperCase() + s[0].slice(1);
  return s.join(" ") + ".";
}

os.print("=== Lorem Ipsum Generator ===\\n");
for (let p = 0; p < 3; p++) {
  const para = [];
  for (let i = 0; i < 4; i++) para.push(sentence());
  os.print(para.join(" "));
  os.print("");
}`,
  },
  {
    category: "Text",
    name: "Morse Code",
    code: `const morse = {A:".-",B:"-...",C:"-.-.",D:"-..",E:".",F:"..-.",G:"--.",H:"....",I:"..",J:".---",K:"-.-",L:".-..",M:"--",N:"-.",O:"---",P:".--.",Q:"--.-",R:".-.",S:"...",T:"-",U:"..-",V:"...-",W:".--",X:"-..-",Y:"-.--",Z:"--.."," ":"/"};

function toMorse(text) {
  return text.toUpperCase().split("").map(c => morse[c] || "?").join(" ");
}

const messages = ["Hello World", "SOS", "BetterWindowsOS"];

os.print("=== Morse Code Encoder ===\\n");
messages.forEach(msg => {
  os.print("Text:  " + msg);
  os.print("Morse: " + toMorse(msg));
  os.print("");
});`,
  },
  {
    category: "Text",
    name: "URL Parser",
    code: `function parseUrl(url) {
  const parts = {};
  const protoEnd = url.indexOf("://");
  parts.protocol = url.slice(0, protoEnd);
  const rest = url.slice(protoEnd + 3);
  const pathStart = rest.indexOf("/");
  parts.host = pathStart >= 0 ? rest.slice(0, pathStart) : rest;
  const pathAndQuery = pathStart >= 0 ? rest.slice(pathStart) : "/";
  const queryStart = pathAndQuery.indexOf("?");
  parts.path = queryStart >= 0 ? pathAndQuery.slice(0, queryStart) : pathAndQuery;
  parts.query = queryStart >= 0 ? pathAndQuery.slice(queryStart + 1) : "";
  return parts;
}

const urls = [
  "https://example.com/path/to/page?id=123&lang=en",
  "http://localhost:3000/api/users",
  "ftp://files.server.com/docs/readme.txt"
];

urls.forEach(url => {
  const p = parseUrl(url);
  os.print("URL: " + url);
  os.print("  Protocol: " + p.protocol);
  os.print("  Host: " + p.host);
  os.print("  Path: " + p.path);
  if (p.query) os.print("  Query: " + p.query);
  os.print("");
});`,
  },
  {
    category: "Text",
    name: "CSV Parser",
    code: `const csv = \`Name,Age,Role,Dept
Alice,28,Engineer,R&D
Bob,34,Designer,Marketing
Carol,41,Manager,Operations
Dave,23,Intern,R&D
Eve,37,Analyst,Finance\`;

os.print("=== CSV Parser ===\\n");
os.print("Raw CSV:");
os.print(csv);

const lines = csv.split("\\n");
const headers = lines[0].split(",");
const rows = lines.slice(1).map(l => {
  const vals = l.split(",");
  const obj = {};
  headers.forEach((h, i) => obj[h] = vals[i]);
  return obj;
});

os.print("\\nParsed (" + rows.length + " records):");
rows.forEach(r => os.print("  " + os.json.stringify(r)));

os.print("\\nAverage age: " + (rows.reduce((a, r) => a + parseInt(r.Age), 0) / rows.length).toFixed(1));`,
  },
  {
    category: "Text",
    name: "Regex Tester",
    code: `const patterns = [
  { regex: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/, name: "Email" },
  { regex: /^\\d{3}-\\d{3}-\\d{4}$/, name: "US Phone" },
  { regex: /^#[0-9a-fA-F]{6}$/, name: "Hex Color" },
  { regex: /^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/, name: "IPv4" },
];

const tests = ["user@example.com", "555-123-4567", "#ff00aa", "192.168.1.1", "not-valid", "123"];

os.print("=== Regex Tester ===\\n");
tests.forEach(val => {
  os.print('Testing "' + val + '":');
  patterns.forEach(p => {
    const match = p.regex.test(val);
    if (match) os.print("  ✓ Matches " + p.name);
  });
  if (!patterns.some(p => p.regex.test(val))) os.print("  ✗ No match");
});`,
  },
  {
    category: "Text",
    name: "Hash Generator",
    code: `function simpleHash(str, seed) {
  let hash = seed || 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

const inputs = ["hello", "Hello", "BetterWindowsOS", "password", "password1"];

os.print("=== Simple Hash Generator ===\\n");
inputs.forEach(s => {
  os.print('  "' + s + '"');
  os.print("    Hash1: " + simpleHash(s, 0));
  os.print("    Hash2: " + simpleHash(s, 5381));
  os.print("");
});`,
  },
  {
    category: "Text",
    name: "Emoji Art",
    code: `const patterns = {
  heart: [
    " 🟥🟥 🟥🟥 ",
    "🟥🟥🟥🟥🟥🟥",
    "🟥🟥🟥🟥🟥🟥",
    " 🟥🟥🟥🟥 ",
    "  🟥🟥🟥  ",
    "   🟥🟥   ",
    "    🟥    ",
  ],
  smiley: [
    "  🟡🟡🟡  ",
    " 🟡🟡🟡🟡 ",
    "🟡⬛🟡⬛🟡",
    " 🟡🟡🟡🟡 ",
    "🟡⬛🟡⬛🟡",
    " 🟡⬛⬛🟡 ",
    "  🟡🟡🟡  ",
  ]
};

os.print("=== Emoji Art ===\\n");
Object.entries(patterns).forEach(([name, rows]) => {
  os.print(name.toUpperCase() + ":");
  rows.forEach(r => os.print("  " + r));
  os.print("");
});`,
  },

  // ═══════════════════════════════════════════
  // GAMES & FUN (66-80)
  // ═══════════════════════════════════════════
  {
    category: "Games",
    name: "Dice Roller",
    code: `function rollDice(count, sides) {
  const rolls = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  return rolls;
}

os.print("=== Dice Roller ===\\n");
const configs = [
  { count: 2, sides: 6, label: "2d6 (Standard)" },
  { count: 1, sides: 20, label: "1d20 (D&D)" },
  { count: 4, sides: 6, label: "4d6 (Stat roll)" },
  { count: 3, sides: 8, label: "3d8" },
  { count: 10, sides: 10, label: "10d10 (Percentile)" },
];

configs.forEach(c => {
  const rolls = rollDice(c.count, c.sides);
  const sum = rolls.reduce((a,b) => a+b, 0);
  os.print(c.label + ": [" + rolls.join(", ") + "] = " + sum);
});`,
  },
  {
    category: "Games",
    name: "Number Guessing Game",
    code: `const secret = Math.floor(Math.random() * 100) + 1;
os.print("=== Number Guessing Game (Auto-play) ===\\n");
os.print("I'm thinking of a number between 1 and 100...\\n");

let lo = 1, hi = 100, attempts = 0;
while (lo <= hi) {
  attempts++;
  const guess = Math.floor((lo + hi) / 2);
  if (guess === secret) {
    os.print("Guess " + attempts + ": " + guess + " — CORRECT!");
    break;
  } else if (guess < secret) {
    os.print("Guess " + attempts + ": " + guess + " — Too low!");
    lo = guess + 1;
  } else {
    os.print("Guess " + attempts + ": " + guess + " — Too high!");
    hi = guess - 1;
  }
}
os.print("\\nFound " + secret + " in " + attempts + " attempts using binary search!");`,
  },
  {
    category: "Games",
    name: "Rock Paper Scissors",
    code: `const choices = ["rock", "paper", "scissors"];
const emoji = { rock: "🪨", paper: "📄", scissors: "✂️" };
let wins = 0, losses = 0, draws = 0;

os.print("=== Rock Paper Scissors (100 rounds) ===\\n");

for (let i = 0; i < 100; i++) {
  const player = choices[Math.floor(Math.random() * 3)];
  const cpu = choices[Math.floor(Math.random() * 3)];
  if (player === cpu) draws++;
  else if (
    (player === "rock" && cpu === "scissors") ||
    (player === "paper" && cpu === "rock") ||
    (player === "scissors" && cpu === "paper")
  ) wins++;
  else losses++;
}

os.print("Results after 100 rounds:");
os.print("  Wins:   " + wins);
os.print("  Losses: " + losses);
os.print("  Draws:  " + draws);
os.print("  Win rate: " + (wins / 100 * 100).toFixed(1) + "%");`,
  },
  {
    category: "Games",
    name: "Maze Generator",
    code: `const W = 15, H = 9;
const grid = Array.from({length: H}, () => Array(W).fill("█"));

function carve(x, y) {
  grid[y][x] = " ";
  const dirs = [[0,-2],[0,2],[-2,0],[2,0]].sort(() => Math.random() - 0.5);
  for (const [dx, dy] of dirs) {
    const nx = x + dx, ny = y + dy;
    if (ny >= 0 && ny < H && nx >= 0 && nx < W && grid[ny][nx] === "█") {
      grid[y + dy/2][x + dx/2] = " ";
      carve(nx, ny);
    }
  }
}

carve(1, 1);
grid[0][1] = "→";
grid[H-1][W-2] = "→";

os.print("=== Random Maze ===\\n");
grid.forEach(row => os.print(row.join("")));`,
  },
  {
    category: "Games",
    name: "Conway's Game of Life",
    code: `const W = 30, H = 15;
let grid = Array.from({length: H}, () =>
  Array.from({length: W}, () => Math.random() < 0.3 ? 1 : 0)
);

function step(g) {
  return g.map((row, y) => row.map((cell, x) => {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (dy || dx) n += (g[y+dy]?.[x+dx] || 0);
    return cell ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
  }));
}

function render(g) {
  return g.map(r => r.map(c => c ? "█" : "·").join("")).join("\\n");
}

os.print("=== Conway's Game of Life ===\\n");
for (let gen = 0; gen < 5; gen++) {
  os.print("Generation " + gen + ":");
  os.print(render(grid));
  os.print("");
  grid = step(grid);
}`,
  },
  {
    category: "Games",
    name: "Tic Tac Toe",
    code: `const board = [" "," "," "," "," "," "," "," "," "];

function printBoard() {
  os.print(" " + board[0] + " | " + board[1] + " | " + board[2]);
  os.print("───┼───┼───");
  os.print(" " + board[3] + " | " + board[4] + " | " + board[5]);
  os.print("───┼───┼───");
  os.print(" " + board[6] + " | " + board[7] + " | " + board[8]);
}

function checkWin(p) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(([a,b,c]) => board[a]===p && board[b]===p && board[c]===p);
}

os.print("=== Tic Tac Toe (Random Game) ===\\n");
const moves = [0,1,2,3,4,5,6,7,8].sort(() => Math.random()-0.5);
let turn = "X";
for (const m of moves) {
  board[m] = turn;
  if (checkWin(turn)) {
    printBoard();
    os.print("\\n" + turn + " wins!");
    break;
  }
  if (!board.includes(" ")) {
    printBoard();
    os.print("\\nDraw!");
    break;
  }
  turn = turn === "X" ? "O" : "X";
}
if (board.includes(" ") && !checkWin("X") && !checkWin("O")) {
  printBoard();
}`,
  },
  {
    category: "Games",
    name: "Slot Machine",
    code: `const symbols = ["🍒", "🍋", "🍊", "🍇", "⭐", "💎", "7️⃣"];
let balance = 100;

os.print("=== Slot Machine ===");
os.print("Starting balance: $" + balance + "\\n");

for (let spin = 1; spin <= 10; spin++) {
  const bet = 10;
  balance -= bet;
  const r = [0,1,2].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
  let line = "Spin " + String(spin).padEnd(3) + "│ " + r.join(" │ ") + " │";

  if (r[0] === r[1] && r[1] === r[2]) {
    const win = r[0] === "7️⃣" ? 100 : r[0] === "💎" ? 50 : 25;
    balance += win;
    line += " JACKPOT! +$" + win;
  } else if (r[0] === r[1] || r[1] === r[2]) {
    balance += 15;
    line += " Pair! +$15";
  } else {
    line += " No match";
  }
  os.print(line);
}

os.print("\\nFinal balance: $" + balance);
os.print(balance >= 100 ? "You're up!" : "Better luck next time!");`,
  },
  {
    category: "Games",
    name: "Card Deck Shuffle",
    code: `const suits = ["♠", "♥", "♦", "♣"];
const ranks = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

const deck = [];
for (const s of suits)
  for (const r of ranks)
    deck.push(r + s);

// Fisher-Yates shuffle
for (let i = deck.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [deck[i], deck[j]] = [deck[j], deck[i]];
}

os.print("=== Shuffled Deck ===\\n");
for (let i = 0; i < 52; i += 13) {
  os.print(deck.slice(i, i + 13).join(" "));
}

os.print("\\nDeal 5 cards:");
const hand = deck.slice(0, 5);
os.print("  " + hand.join("  "));`,
  },
  {
    category: "Games",
    name: "Minesweeper Board",
    code: `const W = 10, H = 8, MINES = 10;
const board = Array.from({length: H}, () => Array(W).fill(0));

// Place mines
let placed = 0;
while (placed < MINES) {
  const x = Math.floor(Math.random() * W);
  const y = Math.floor(Math.random() * H);
  if (board[y][x] !== -1) {
    board[y][x] = -1;
    placed++;
  }
}

// Calculate numbers
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    if (board[y][x] === -1) continue;
    let count = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (board[y+dy]?.[x+dx] === -1) count++;
    board[y][x] = count;
  }

os.print("=== Minesweeper (revealed) ===\\n");
const sym = v => v === -1 ? "💣" : v === 0 ? "·" : String(v);
board.forEach(row => os.print("  " + row.map(sym).join(" ")));
os.print("\\n" + MINES + " mines on " + W + "x" + H + " board");`,
  },
  {
    category: "Games",
    name: "Hangman Auto-play",
    code: `const words = ["javascript","algorithm","function","variable","keyboard","terminal","browser","desktop"];
const word = words[Math.floor(Math.random() * words.length)];
const guessed = new Set();
let lives = 6;

os.print("=== Hangman Auto-play ===\\n");
const alphabet = "etaoinsrhldcumfpgwybvkxjqz".split("");

for (const letter of alphabet) {
  if (lives <= 0) break;
  guessed.add(letter);
  const display = word.split("").map(c => guessed.has(c) ? c : "_").join(" ");

  if (!word.includes(letter)) {
    lives--;
    os.print("Guess '" + letter + "' — MISS! Lives: " + "❤️".repeat(lives) + "🖤".repeat(6-lives));
  } else {
    os.print("Guess '" + letter + "' — HIT!  " + display);
  }

  if (!display.includes("_")) {
    os.print("\\nWon! The word was: " + word);
    break;
  }
}

if (lives <= 0) os.print("\\nLost! The word was: " + word);`,
  },
  {
    category: "Games",
    name: "Treasure Map",
    code: `const W = 12, H = 8;
const map = Array.from({length: H}, () => Array(W).fill("~"));

// Place terrain
for (let i = 0; i < 15; i++) {
  map[Math.floor(Math.random()*H)][Math.floor(Math.random()*W)] = "▲";
}
for (let i = 0; i < 10; i++) {
  map[Math.floor(Math.random()*H)][Math.floor(Math.random()*W)] = "♣";
}

const tx = Math.floor(Math.random()*W), ty = Math.floor(Math.random()*H);
map[ty][tx] = "X";
map[0][0] = "☺";

os.print("=== Treasure Map ===\\n");
os.print("Legend: ☺=You  X=Treasure  ▲=Mountain  ♣=Forest  ~=Plains\\n");
map.forEach(row => os.print("  " + row.join(" ")));

const dist = Math.abs(tx) + Math.abs(ty);
os.print("\\nTreasure is " + dist + " steps away (Manhattan distance)");`,
  },
  {
    category: "Games",
    name: "Typing Speed Test",
    code: `const sentences = [
  "the quick brown fox jumps over the lazy dog",
  "pack my box with five dozen liquor jugs",
  "how vexingly quick daft zebras jump"
];

os.print("=== Typing Speed Simulator ===\\n");

sentences.forEach(s => {
  const words = s.split(" ").length;
  const chars = s.length;
  const simWpm = Math.floor(Math.random() * 40 + 40);
  const simTime = (words / simWpm * 60).toFixed(1);
  const simAccuracy = (Math.random() * 5 + 95).toFixed(1);

  os.print('"' + s + '"');
  os.print("  Words: " + words + "  Chars: " + chars);
  os.print("  Speed: " + simWpm + " WPM  Time: " + simTime + "s  Accuracy: " + simAccuracy + "%");
  os.print("");
});`,
  },
  {
    category: "Games",
    name: "Dungeon Generator",
    code: `const W = 40, H = 15;
const map = Array.from({length: H}, () => Array(W).fill("#"));

function room(x1,y1,x2,y2) {
  for(let y=y1;y<=y2;y++) for(let x=x1;x<=x2;x++) map[y][x]=".";
}

function hallH(y,x1,x2) {
  for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++) map[y][x]=".";
}

function hallV(x,y1,y2) {
  for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++) map[y][x]=".";
}

const rooms = [];
for(let i=0;i<5;i++) {
  const rw=Math.floor(Math.random()*6)+3, rh=Math.floor(Math.random()*4)+2;
  const rx=Math.floor(Math.random()*(W-rw-2))+1, ry=Math.floor(Math.random()*(H-rh-2))+1;
  room(rx,ry,rx+rw,ry+rh);
  rooms.push({cx:rx+Math.floor(rw/2), cy:ry+Math.floor(rh/2)});
}

for(let i=1;i<rooms.length;i++) {
  const a=rooms[i-1], b=rooms[i];
  hallH(a.cy, a.cx, b.cx);
  hallV(b.cx, a.cy, b.cy);
}

map[rooms[0].cy][rooms[0].cx]="@";
map[rooms[rooms.length-1].cy][rooms[rooms.length-1].cx]="$";

os.print("=== Dungeon ===");
os.print("@ = Player  $ = Exit\\n");
map.forEach(r=>os.print(r.join("")));`,
  },
  {
    category: "Games",
    name: "Blackjack Hand",
    code: `function deal() { return Math.floor(Math.random()*13)+1; }
function cardName(v) {
  if(v===1) return "A"; if(v===11) return "J";
  if(v===12) return "Q"; if(v===13) return "K";
  return String(v);
}
function handValue(cards) {
  let total=0, aces=0;
  for(const c of cards) {
    if(c===1){aces++;total+=11;} else if(c>=10){total+=10;} else{total+=c;}
  }
  while(total>21&&aces>0){total-=10;aces--;}
  return total;
}

const player=[deal(),deal()], dealer=[deal(),deal()];

os.print("=== Blackjack ===\\n");
os.print("Player: " + player.map(cardName).join(" ") + " = " + handValue(player));
os.print("Dealer: " + cardName(dealer[0]) + " [?]\\n");

while(handValue(player)<17){const c=deal();player.push(c);os.print("Player hits: "+cardName(c));}
os.print("Player stands at " + handValue(player));

os.print("\\nDealer reveals: " + dealer.map(cardName).join(" "));
while(handValue(dealer)<17){const c=deal();dealer.push(c);os.print("Dealer hits: "+cardName(c));}

const pv=handValue(player), dv=handValue(dealer);
os.print("\\nPlayer: " + pv + (pv>21?" BUST":""));
os.print("Dealer: " + dv + (dv>21?" BUST":""));

if(pv>21) os.print("\\nDealer wins!");
else if(dv>21) os.print("\\nPlayer wins!");
else if(pv>dv) os.print("\\nPlayer wins!");
else if(dv>pv) os.print("\\nDealer wins!");
else os.print("\\nPush (tie)!");`,
  },
  {
    category: "Games",
    name: "Fortune Cookie",
    code: `const fortunes = [
  "A beautiful, smart, and loving person will come into your code.",
  "Your code will compile on the first try... eventually.",
  "A bug is just a feature waiting to be documented.",
  "The variable you seek is in the scope you least expect.",
  "Beware of off-by-one errors... they're closer than you think.",
  "A null pointer awaits the impatient developer.",
  "Your next commit will be legendary.",
  "The semicolon you missed will find you.",
  "Refactoring is the path to enlightenment.",
  "You will solve that impossible bug tomorrow morning.",
];

const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

os.print("╔══════════════════════════════════╗");
os.print("║       🥠 FORTUNE COOKIE 🥠       ║");
os.print("╠══════════════════════════════════╣");
os.print("║                                  ║");

const padded = fortune.length <= 34
  ? fortune.padEnd(34)
  : fortune.slice(0, 31) + "...";
os.print("║ " + padded + " ║");
os.print("║                                  ║");
os.print("╚══════════════════════════════════╝");

os.print("\\nLucky numbers: " + Array.from({length:6},()=>Math.floor(Math.random()*49)+1).sort((a,b)=>a-b).join(", "));`,
  },

  // ═══════════════════════════════════════════
  // UTILITIES (81-90)
  // ═══════════════════════════════════════════
  {
    category: "Utilities",
    name: "Notification Tester",
    code: `os.print("=== Notification Tester ===\\n");

os.notify("Info", "This is an informational notification");
os.print("Sent: info notification");

os.notify("Success", "Operation completed successfully!", "success");
os.print("Sent: success notification");

os.notify("Warning", "Disk space running low", "warning");
os.print("Sent: warning notification");

os.notify("Error", "Connection timed out", "error");
os.print("Sent: error notification");

os.print("\\nAll notifications dispatched!");`,
  },
  {
    category: "Utilities",
    name: "Color Palette Generator",
    code: `function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1-l);
  const f = n => {
    const k = (n + h/30) % 12;
    const color = l - a * Math.max(Math.min(k-3, 9-k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return "#" + f(0) + f(8) + f(4);
}

os.print("=== Color Palettes ===\\n");

os.print("Rainbow:");
for (let h = 0; h < 360; h += 30) {
  os.print("  " + hslToHex(h, 80, 60) + " — H:" + h + "°");
}

os.print("\\nPastels:");
for (let h = 0; h < 360; h += 45) {
  os.print("  " + hslToHex(h, 70, 80) + " — H:" + h + "°");
}

os.print("\\nMonochrome:");
for (let l = 10; l <= 90; l += 10) {
  os.print("  " + hslToHex(210, 20, l) + " — L:" + l + "%");
}`,
  },
  {
    category: "Utilities",
    name: "Stopwatch",
    code: `os.print("=== Stopwatch Simulation ===\\n");
const start = Date.now();

const laps = [
  { name: "Array sort (10k)", fn: () => { Array.from({length:10000},()=>Math.random()).sort(); }},
  { name: "String concat (5k)", fn: () => { let s=""; for(let i=0;i<5000;i++) s+="x"; }},
  { name: "Object create (10k)", fn: () => { for(let i=0;i<10000;i++) ({a:i,b:i*2}); }},
  { name: "Math operations (50k)", fn: () => { for(let i=0;i<50000;i++) Math.sqrt(i*Math.PI); }},
];

laps.forEach(lap => {
  const t0 = performance.now();
  lap.fn();
  const t1 = performance.now();
  os.print(lap.name.padEnd(25) + (t1-t0).toFixed(3) + " ms");
});

os.print("\\nTotal elapsed: " + (Date.now() - start) + " ms");`,
  },
  {
    category: "Utilities",
    name: "Unit Converter",
    code: `const conversions = [
  { from: "1 mile", to: "km", result: 1.60934 },
  { from: "1 kg", to: "lbs", result: 2.20462 },
  { from: "1 inch", to: "cm", result: 2.54 },
  { from: "1 gallon", to: "liters", result: 3.78541 },
  { from: "1 foot", to: "meters", result: 0.3048 },
  { from: "1 ounce", to: "grams", result: 28.3495 },
  { from: "1 yard", to: "meters", result: 0.9144 },
  { from: "1 lb", to: "kg", result: 0.453592 },
];

os.print("=== Unit Converter ===\\n");
conversions.forEach(c => {
  os.print("  " + c.from + " = " + c.result.toFixed(4) + " " + c.to);
});

os.print("\\n=== Custom ===");
const miles = 26.2;
os.print("Marathon: " + miles + " miles = " + (miles * 1.60934).toFixed(2) + " km");

const kg = 75;
os.print("Weight: " + kg + " kg = " + (kg * 2.20462).toFixed(1) + " lbs");`,
  },
  {
    category: "Utilities",
    name: "Calendar",
    code: `const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const first = new Date(year, month, 1).getDay();
const days = new Date(year, month + 1, 0).getDate();
const today = now.getDate();

os.print("=== " + monthNames[month] + " " + year + " ===\\n");
os.print(" Su Mo Tu We Th Fr Sa");

let line = "   ".repeat(first);
for (let d = 1; d <= days; d++) {
  const marker = d === today ? "[" + String(d).padStart(2) + "]" : " " + String(d).padStart(2) + " ";
  line += marker;
  if ((first + d) % 7 === 0) {
    os.print(line);
    line = "";
  }
}
if (line.trim()) os.print(line);
os.print("\\nToday: " + monthNames[month] + " " + today + ", " + year);`,
  },
  {
    category: "Utilities",
    name: "UUID Generator",
    code: `function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

os.print("=== UUID Generator ===\\n");
for (let i = 0; i < 10; i++) {
  os.print("  " + uuid());
}

os.print("\\nShort IDs:");
for (let i = 0; i < 5; i++) {
  os.print("  " + uuid().split("-")[0]);
}`,
  },
  {
    category: "Utilities",
    name: "Countdown Timer",
    code: `os.print("=== Countdown from 10 ===\\n");
for (let i = 10; i >= 0; i--) {
  const bar = "█".repeat(i * 3) + "░".repeat((10 - i) * 3);
  const label = i === 0 ? "LAUNCH!" : String(i);
  os.print("[" + bar + "] " + label);
}
os.print("\\n🚀 Liftoff!");
os.notify("Countdown", "Launch sequence complete!");`,
  },
  {
    category: "Utilities",
    name: "Progress Bar Demo",
    code: `function progressBar(pct, width) {
  const filled = Math.round(pct / 100 * width);
  return "[" + "█".repeat(filled) + "░".repeat(width - filled) + "] " + pct + "%";
}

os.print("=== Progress Bars ===\\n");

os.print("Download:   " + progressBar(73, 30));
os.print("Upload:     " + progressBar(45, 30));
os.print("Install:    " + progressBar(100, 30));
os.print("Backup:     " + progressBar(12, 30));
os.print("Scan:       " + progressBar(89, 30));

os.print("\\n=== Incremental ===\\n");
for (let p = 0; p <= 100; p += 10) {
  os.print(progressBar(p, 40));
}`,
  },
  {
    category: "Utilities",
    name: "Date Calculator",
    code: `const now = new Date();

function daysBetween(d1, d2) {
  return Math.floor(Math.abs(d2 - d1) / 86400000);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

os.print("=== Date Calculator ===\\n");
os.print("Today: " + now.toLocaleDateString());

const jan1 = new Date(now.getFullYear(), 0, 1);
os.print("Day of year: " + daysBetween(jan1, now));

const dec31 = new Date(now.getFullYear(), 11, 31);
os.print("Days left in year: " + daysBetween(now, dec31));

os.print("\\n+30 days: " + addDays(now, 30).toLocaleDateString());
os.print("+90 days: " + addDays(now, 90).toLocaleDateString());
os.print("+365 days: " + addDays(now, 365).toLocaleDateString());

const epoch = new Date(0);
os.print("\\nDays since epoch: " + daysBetween(epoch, now));`,
  },
  {
    category: "Utilities",
    name: "JSON Config Editor",
    code: `// Simulated config file editing
const config = {
  app: "BetterWindowsOS",
  theme: "dark",
  resolution: "1920x1080",
  fps: 60,
  features: {
    animations: true,
    sounds: true,
    notifications: true,
    autosave: true,
    autosaveInterval: 30
  },
  network: {
    proxy: null,
    dns: "8.8.8.8",
    timeout: 5000
  }
};

os.print("=== Current Config ===");
os.print(os.json.stringify(config));

os.print("\\n=== Modifying ===");
config.theme = "light";
config.features.autosaveInterval = 60;
config.network.dns = "1.1.1.1";

os.print("Changed theme: dark → light");
os.print("Changed autosave: 30s → 60s");
os.print("Changed DNS: 8.8.8.8 → 1.1.1.1");

os.files.write("/system.conf", os.json.stringify(config));
os.print("\\nConfig saved!");`,
  },

  // ═══════════════════════════════════════════
  // AUTOMATION (91-100)
  // ═══════════════════════════════════════════
  {
    category: "Automation",
    name: "System Audit",
    code: `os.print("╔════════════════════════════════════╗");
os.print("║        SYSTEM AUDIT REPORT         ║");
os.print("╚════════════════════════════════════╝\\n");

const info = os.system.info();
os.print("[1/5] System Identity");
os.print("  " + info.name + " v" + info.version + " (build " + info.build + ")");

os.print("\\n[2/5] Hardware");
os.print("  CPU Cores: " + info.cores);
os.print("  Memory: " + info.memory);
os.print("  Uptime: " + info.uptime);

os.print("\\n[3/5] Processes");
const procs = os.processes.list();
os.print("  Running: " + procs.filter(p=>p.status==="running").length);
os.print("  Sleeping: " + procs.filter(p=>p.status==="sleeping").length);
os.print("  Total CPU: " + procs.reduce((a,p)=>a+p.cpu,0).toFixed(1) + "%");

os.print("\\n[4/5] Filesystem");
["/","/Desktop","/Documents","/Downloads"].forEach(d => {
  const f = os.files.list(d);
  os.print("  " + d + ": " + f.length + " items");
});

os.print("\\n[5/5] Environment");
["USER","SHELL","LANG","EDITOR"].forEach(v => {
  os.print("  $" + v + "=" + os.system.env(v));
});

os.print("\\n════════════════════════════════════");
os.print("Audit complete. All systems nominal.");
os.notify("Audit", "System audit completed successfully");`,
  },
  {
    category: "Automation",
    name: "Log Analyzer",
    code: `// Generate simulated logs
const levels = ["INFO", "WARN", "ERROR", "DEBUG"];
const sources = ["kernel", "network", "fs", "app", "auth"];
const messages = {
  INFO: ["Service started", "Connection established", "File saved", "User logged in"],
  WARN: ["Disk space low", "High CPU usage", "Deprecated API call", "Slow query"],
  ERROR: ["Connection refused", "File not found", "Permission denied", "Timeout"],
  DEBUG: ["Cache miss", "GC triggered", "Socket opened", "Buffer flushed"]
};

const logs = [];
for (let i = 0; i < 50; i++) {
  const level = levels[Math.floor(Math.random() * levels.length)];
  logs.push({
    level,
    source: sources[Math.floor(Math.random() * sources.length)],
    msg: messages[level][Math.floor(Math.random() * messages[level].length)]
  });
}

const counts = {};
logs.forEach(l => counts[l.level] = (counts[l.level] || 0) + 1);

os.print("=== Log Analysis (50 entries) ===\\n");
os.print("By level:");
Object.entries(counts).forEach(([level, count]) => {
  const bar = "█".repeat(count);
  os.print("  " + level.padEnd(6) + bar + " (" + count + ")");
});

os.print("\\nErrors:");
logs.filter(l => l.level === "ERROR").forEach(l => {
  os.error("[" + l.source + "] " + l.msg);
});`,
  },
  {
    category: "Automation",
    name: "Batch File Processor",
    code: `os.print("=== Batch File Processor ===\\n");

const dirs = ["/Desktop", "/Documents", "/Downloads"];
let totalProcessed = 0;
const report = [];

dirs.forEach(dir => {
  const files = os.files.list(dir);
  os.print("Processing " + dir + "...");

  files.forEach(f => {
    if (f.type === "file") {
      totalProcessed++;
      const ext = f.name.split(".").pop() || "unknown";
      const action = f.size > 100000 ? "COMPRESS" : "KEEP";
      const sizeStr = (f.size / 1024).toFixed(1) + "KB";
      report.push({ dir, name: f.name, ext, size: sizeStr, action });
      os.print("  " + action + ": " + f.name + " (" + sizeStr + ")");
    }
  });
});

os.print("\\n=== Summary ===");
os.print("Files processed: " + totalProcessed);
os.print("Compressed: " + report.filter(r => r.action === "COMPRESS").length);
os.print("Kept as-is: " + report.filter(r => r.action === "KEEP").length);
os.notify("Batch", "Processed " + totalProcessed + " files");`,
  },
  {
    category: "Automation",
    name: "Cron Job Simulator",
    code: `const jobs = [
  { schedule: "*/5 * * * *", name: "Health Check", fn: () => "OK — CPU: " + (Math.random()*10).toFixed(1) + "%" },
  { schedule: "0 * * * *", name: "Log Rotate", fn: () => "Rotated 3 log files" },
  { schedule: "0 0 * * *", name: "Daily Backup", fn: () => "Backed up " + Math.floor(Math.random()*50+10) + " files" },
  { schedule: "0 0 * * 0", name: "Weekly Report", fn: () => "Report generated: 847 events" },
  { schedule: "0 3 1 * *", name: "Monthly Cleanup", fn: () => "Freed " + Math.floor(Math.random()*500+100) + "MB" },
];

os.print("=== Cron Job Simulator ===\\n");
os.print("SCHEDULE".padEnd(18) + "JOB".padEnd(20) + "OUTPUT");
os.print("─".repeat(65));

jobs.forEach(job => {
  const result = job.fn();
  os.print(job.schedule.padEnd(18) + job.name.padEnd(20) + result);
});

os.print("\\n" + jobs.length + " cron jobs configured and running.");`,
  },
  {
    category: "Automation",
    name: "Process Watchdog",
    code: `os.print("=== Process Watchdog ===\\n");

const critical = ["system", "window-manager", "desktop-compositor", "network-manager"];
const procs = os.processes.list();

os.print("Checking critical processes...\\n");
let allOk = true;

critical.forEach(name => {
  const proc = procs.find(p => p.name === name);
  if (!proc) {
    os.error("MISSING: " + name + " — attempting restart...");
    allOk = false;
  } else if (proc.status !== "running") {
    os.warn("DEGRADED: " + name + " (status: " + proc.status + ")");
    allOk = false;
  } else if (proc.cpu > 5) {
    os.warn("HIGH CPU: " + name + " (" + proc.cpu + "%)");
  } else {
    os.print("  ✓ " + name + " — OK (CPU: " + proc.cpu + "%, MEM: " + proc.memory + "MB)");
  }
});

os.print("\\nOverall: " + (allOk ? "All systems nominal" : "Issues detected — see above"));
os.notify("Watchdog", allOk ? "All processes healthy" : "Issues detected!");`,
  },
  {
    category: "Automation",
    name: "Disk Cleanup",
    code: `os.print("=== Disk Cleanup Utility ===\\n");

const dirs = ["/", "/Desktop", "/Documents", "/Downloads"];
let totalSize = 0;
let cleanable = 0;
const candidates = [];

dirs.forEach(dir => {
  os.files.list(dir).forEach(f => {
    totalSize += f.size;
    if (f.name.endsWith(".tmp") || f.name.endsWith(".old") || f.name.endsWith(".log")) {
      cleanable += f.size;
      candidates.push(dir + "/" + f.name);
    }
    if (f.size > 1048576) {
      candidates.push(dir + "/" + f.name + " (large: " + (f.size/1048576).toFixed(1) + "MB)");
    }
  });
});

os.print("Total scanned: " + (totalSize / 1024).toFixed(1) + " KB");
os.print("Cleanable: " + (cleanable / 1024).toFixed(1) + " KB");

if (candidates.length > 0) {
  os.print("\\nCleanup candidates:");
  candidates.forEach(c => os.print("  → " + c));
}

os.print("\\nLarge files (>1MB):");
dirs.forEach(dir => {
  os.files.list(dir).filter(f => f.size > 1048576).forEach(f => {
    os.print("  " + dir + "/" + f.name + " — " + (f.size/1048576).toFixed(2) + " MB");
  });
});

os.notify("Cleanup", "Scan complete: " + candidates.length + " items found");`,
  },
  {
    category: "Automation",
    name: "Scheduled Tasks",
    code: `os.print("=== Task Scheduler ===\\n");

const tasks = [
  { time: "00:00", task: "Rotate system logs", status: "completed" },
  { time: "01:00", task: "Database vacuum", status: "completed" },
  { time: "02:00", task: "Incremental backup", status: "completed" },
  { time: "03:00", task: "Security scan", status: "completed" },
  { time: "06:00", task: "Clear temp files", status: "completed" },
  { time: "08:00", task: "Update check", status: "running" },
  { time: "12:00", task: "Midday health report", status: "pending" },
  { time: "18:00", task: "Usage statistics", status: "pending" },
  { time: "22:00", task: "Full backup", status: "pending" },
  { time: "23:00", task: "Index rebuild", status: "pending" },
];

const icon = { completed: "✓", running: "►", pending: "○" };

os.print("TIME   STATUS      TASK");
os.print("─".repeat(45));
tasks.forEach(t => {
  os.print(t.time + "   " + icon[t.status] + " " + t.status.padEnd(10) + t.task);
});

os.print("\\nCompleted: " + tasks.filter(t=>t.status==="completed").length);
os.print("Running: " + tasks.filter(t=>t.status==="running").length);
os.print("Pending: " + tasks.filter(t=>t.status==="pending").length);`,
  },
  {
    category: "Automation",
    name: "Deploy Script",
    code: `os.print("╔══════════════════════════════════╗");
os.print("║      DEPLOYMENT PIPELINE         ║");
os.print("╚══════════════════════════════════╝\\n");

const steps = [
  { name: "Pull latest code", cmd: "git pull origin main" },
  { name: "Install dependencies", cmd: "npm install" },
  { name: "Run linter", cmd: "npm run lint" },
  { name: "Run tests", cmd: "npm test" },
  { name: "Build project", cmd: "npm run build" },
  { name: "Copy to server", cmd: "scp -r dist/ server:/app" },
  { name: "Restart service", cmd: "systemctl restart app" },
  { name: "Health check", cmd: "curl http://localhost:3000/health" },
];

let failed = false;
steps.forEach((step, i) => {
  if (failed) {
    os.print("[SKIP] " + step.name);
    return;
  }
  os.print("[" + (i+1) + "/" + steps.length + "] " + step.name);
  os.info("  $ " + step.cmd);

  // Simulate random failure (10% chance)
  if (Math.random() < 0.1) {
    os.error("  FAILED!");
    failed = true;
  } else {
    os.print("  OK (" + (Math.random()*5+0.5).toFixed(1) + "s)");
  }
});

os.print("\\n" + (failed ? "DEPLOYMENT FAILED" : "DEPLOYMENT SUCCESSFUL"));
os.notify("Deploy", failed ? "Deployment failed!" : "Deployed successfully!");`,
  },
  {
    category: "Automation",
    name: "Service Monitor Dashboard",
    code: `const services = [
  { name: "Web Server", port: 80, uptime: 99.9 },
  { name: "API Gateway", port: 443, uptime: 99.7 },
  { name: "Database", port: 5432, uptime: 99.99 },
  { name: "Cache (Redis)", port: 6379, uptime: 100 },
  { name: "Message Queue", port: 5672, uptime: 98.5 },
  { name: "Search Engine", port: 9200, uptime: 99.2 },
  { name: "File Storage", port: 9000, uptime: 99.8 },
  { name: "Auth Service", port: 8080, uptime: 99.95 },
];

os.print("╔═══════════════════════════════════════════════════╗");
os.print("║            SERVICE MONITOR DASHBOARD              ║");
os.print("╠═══════════════════════════════════════════════════╣\\n");

os.print("SERVICE".padEnd(20) + "PORT".padEnd(8) + "UPTIME".padEnd(10) + "STATUS");
os.print("─".repeat(50));

services.forEach(s => {
  const online = Math.random() > 0.05;
  const status = online ? "● ONLINE" : "● DOWN";
  const upStr = s.uptime.toFixed(2) + "%";
  const line = s.name.padEnd(20) + String(s.port).padEnd(8) + upStr.padEnd(10) + status;
  if (online) os.print(line);
  else os.error(line);
});

os.print("\\nLast checked: " + new Date().toLocaleTimeString());
const avg = (services.reduce((a,s)=>a+s.uptime,0)/services.length).toFixed(2);
os.print("Average uptime: " + avg + "%");`,
  },
  {
    category: "Automation",
    name: "Full System Report",
    code: `const divider = "═".repeat(50);
os.print(divider);
os.print("  BETTERWINDOWSOS — FULL SYSTEM REPORT");
os.print("  Generated: " + new Date().toLocaleString());
os.print(divider);

// System
const info = os.system.info();
os.print("\\n[SYSTEM]");
os.print("  OS: " + info.name + " v" + info.version);
os.print("  Build: " + info.build);
os.print("  Platform: " + info.platform);
os.print("  Hostname: " + os.system.hostname());
os.print("  Cores: " + info.cores);
os.print("  Memory: " + info.memory);
os.print("  Uptime: " + info.uptime);

// Processes
const procs = os.processes.list();
os.print("\\n[PROCESSES] (" + procs.length + " total)");
procs.sort((a,b) => b.cpu - a.cpu).forEach(p => {
  os.print("  " + String(p.pid).padEnd(5) + p.name.padEnd(22) + p.status.padEnd(10) + p.cpu + "% CPU");
});

// Filesystem
os.print("\\n[FILESYSTEM]");
["/", "/Desktop", "/Documents", "/Downloads"].forEach(dir => {
  const files = os.files.list(dir);
  const totalSize = files.reduce((a,f) => a + f.size, 0);
  os.print("  " + dir.padEnd(15) + files.length + " items, " + (totalSize/1024).toFixed(1) + " KB");
});

// Environment
os.print("\\n[ENVIRONMENT]");
["USER", "HOME", "SHELL", "PATH", "EDITOR", "LANG"].forEach(k => {
  os.print("  " + k + "=" + os.system.env(k));
});

os.print("\\n" + divider);
os.print("  Report complete. " + procs.length + " processes, " + info.cores + " cores.");
os.print(divider);
os.notify("Report", "Full system report generated");`,
  },
];
