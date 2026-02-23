import type { StoreState } from "../../os/state/store";
import { listFolder } from "../../os/fs/fsOps";

type CommandResult = {
  output: string[];
  nextCwd?: string;
  clear?: boolean;
};

/** Build the full path from root for display */
const getFullPath = (fs: StoreState["fs"], nodeId: string): string => {
  const parts: string[] = [];
  let current = fs.nodes[nodeId];
  while (current && current.parentId) {
    parts.unshift(current.name);
    current = fs.nodes[current.parentId];
  }
  return "/" + parts.join("/");
};

const formatPrompt = (path: string, username: string) =>
  `${username}@webos:${path}$`;

/** Provide tab-completion candidates for a partial path */
export const getCompletions = (
  partial: string,
  cwdId: string,
  store: StoreState
): string[] => {
  const lastSlash = partial.lastIndexOf("/");
  const dir = lastSlash >= 0 ? partial.slice(0, lastSlash) || "/" : ".";
  const prefix = lastSlash >= 0 ? partial.slice(lastSlash + 1) : partial;

  const resolved = store.fsResolvePath(dir, cwdId);
  if (!resolved || resolved.type !== "folder") return [];

  const children = listFolder(store.fs, resolved.id);
  return children
    .filter((n) => n.name.toLowerCase().startsWith(prefix.toLowerCase()))
    .map((n) => {
      const base = lastSlash >= 0 ? dir + "/" + n.name : n.name;
      return n.type === "folder" ? base + "/" : base;
    });
};

export const runCommand = (
  input: string,
  cwdId: string,
  store: StoreState
): CommandResult => {
  const trimmed = input.trim();
  if (!trimmed) return { output: [] };
  const [cmd, ...rest] = trimmed.split(" ");
  const args = rest.join(" ").trim();
  const fullPath = getFullPath(store.fs, cwdId);
  const prompt = formatPrompt(fullPath, store.username || "user");

  switch (cmd) {
    // ── Secret / Easter egg commands ────────────────────────
    case "secret":
      return {
        output: [
          `${prompt} ${input}`,
          "SECRET COMMANDS:",
          "  matrix       - enter the mainframe",
          "  coffee break - you deserve it",
          "  update       - system maintenance",
          "  gravity on   - unleash physics",
          "  gravity off  - restore order",
          "  pulse ui     - make the system breathe",
        ],
      };
    case "matrix":
      store.toggleMatrix();
      return { output: [`${prompt} ${input}`, "Matrix mode toggled"] };
    case "coffee":
      if (args === "break") {
        store.setCoffeeBreak(true);
        return { output: [`${prompt} ${input}`, "Enjoy your break!"] };
      }
      return { output: [`${prompt} ${input}`, "Usage: coffee break"] };
    case "update":
      store.setUpdateScreen(true);
      return { output: [`${prompt} ${input}`, "Updating... please do not turn off your computer."] };
    case "gravity":
      if (args === "on") { store.setGravity(true); return { output: [`${prompt} ${input}`, "Gravity enabled"] }; }
      if (args === "off") { store.setGravity(false); return { output: [`${prompt} ${input}`, "Gravity disabled"] }; }
      return { output: [`${prompt} ${input}`, "Usage: gravity <on/off>"] };
    case "pulse":
      if (args === "ui") { store.setPulseUi(!store.pulseUiActive); return { output: [`${prompt} ${input}`, "Pulse UI toggled"] }; }
      return { output: [`${prompt} ${input}`, "Usage: pulse ui"] };

    // ── Standard commands ───────────────────────────────────
    case "help":
      return {
        output: [
          `${prompt} ${input}`,
          "Available commands:",
          "  help                  Show this help",
          "  ls [path]             List directory contents",
          "  cd <path>             Change directory",
          "  pwd                   Print working directory",
          "  mkdir <name>          Create folder",
          "  touch <name>          Create file",
          "  cat <file>            Show file contents",
          "  echo <text> > <file>  Write text to file",
          "  rm <name>             Delete file or folder",
          "  cp <src> <dest>       Copy file",
          "  mv <src> <dest>       Move/rename file",
          "  grep <text> <file>    Search file contents",
          "  whoami                Show current user",
          "  date                  Show current date/time",
          "  neofetch              Show system info",
          "  clear                 Clear terminal",
          "  secret                List secret commands",
        ],
      };

    case "ls": {
      const target = args ? store.fsResolvePath(args, cwdId) : store.fs.nodes[cwdId];
      if (!target || target.type !== "folder") {
        return { output: [`${prompt} ${input}`, "Not a directory"] };
      }
      const nodes = store.fsList(target.id);
      if (nodes.length === 0) return { output: [`${prompt} ${input}`, "(empty)"] };
      const lines = nodes.map((n) => {
        const icon = n.type === "folder" ? "📁" : "📄";
        const size = n.type === "file" ? `${(n.content?.length ?? 0)}B` : "";
        return `  ${icon} ${n.name.padEnd(24)} ${size}`;
      });
      return { output: [`${prompt} ${input}`, ...lines] };
    }

    case "cd": {
      const target = args || "~";
      const next = store.fsResolvePath(target, cwdId);
      if (next?.type === "folder") {
        return { output: [`${prompt} ${input}`], nextCwd: next.id };
      }
      return { output: [`${prompt} ${input}`, `cd: ${target}: No such directory`] };
    }

    case "pwd":
      return { output: [`${prompt} ${input}`, fullPath] };

    case "mkdir":
      if (!args) return { output: [`${prompt} ${input}`, "Usage: mkdir <name>"] };
      store.fsMkdir(cwdId, args);
      return { output: [`${prompt} ${input}`] };

    case "touch":
      if (!args) return { output: [`${prompt} ${input}`, "Usage: touch <name>"] };
      store.fsTouch(cwdId, args, "");
      return { output: [`${prompt} ${input}`] };

    case "cat": {
      if (!args) return { output: [`${prompt} ${input}`, "Usage: cat <file>"] };
      const node = store.fsResolvePath(args, cwdId);
      if (node?.type === "file") {
        return { output: [`${prompt} ${input}`, node.content ?? ""] };
      }
      return { output: [`${prompt} ${input}`, `cat: ${args}: No such file`] };
    }

    case "rm": {
      if (!args) return { output: [`${prompt} ${input}`, "Usage: rm <name>"] };
      const node = store.fsResolvePath(args, cwdId);
      if (!node) return { output: [`${prompt} ${input}`, `rm: ${args}: No such file or directory`] };
      store.fsDelete(node.id);
      return { output: [`${prompt} ${input}`] };
    }

    case "cp": {
      const parts = args.split(/\s+/);
      if (parts.length < 2) return { output: [`${prompt} ${input}`, "Usage: cp <source> <destination>"] };
      const src = store.fsResolvePath(parts[0], cwdId);
      const destDir = store.fsResolvePath(parts[1], cwdId);
      if (!src) return { output: [`${prompt} ${input}`, `cp: ${parts[0]}: No such file`] };
      if (!destDir || destDir.type !== "folder") return { output: [`${prompt} ${input}`, `cp: ${parts[1]}: No such directory`] };
      store.fsCopy(src.id, destDir.id);
      return { output: [`${prompt} ${input}`] };
    }

    case "mv": {
      const parts = args.split(/\s+/);
      if (parts.length < 2) return { output: [`${prompt} ${input}`, "Usage: mv <source> <destination>"] };
      const src = store.fsResolvePath(parts[0], cwdId);
      if (!src) return { output: [`${prompt} ${input}`, `mv: ${parts[0]}: No such file`] };
      // If destination is a folder, move into it. Otherwise treat as rename.
      const dest = store.fsResolvePath(parts[1], cwdId);
      if (dest?.type === "folder") {
        store.fsMove(src.id, dest.id);
      } else {
        store.fsRename(src.id, parts[1]);
      }
      return { output: [`${prompt} ${input}`] };
    }

    case "grep": {
      const spaceIdx = args.indexOf(" ");
      if (spaceIdx < 0) return { output: [`${prompt} ${input}`, "Usage: grep <text> <file>"] };
      const searchText = args.slice(0, spaceIdx);
      const fileName = args.slice(spaceIdx + 1).trim();
      const node = store.fsResolvePath(fileName, cwdId);
      if (!node || node.type !== "file") return { output: [`${prompt} ${input}`, `grep: ${fileName}: No such file`] };
      const lines = (node.content ?? "").split("\n");
      const matches = lines.filter((l) => l.toLowerCase().includes(searchText.toLowerCase()));
      if (matches.length === 0) return { output: [`${prompt} ${input}`, "(no matches)"] };
      return { output: [`${prompt} ${input}`, ...matches] };
    }

    case "echo": {
      const match = args.match(/(.*)\s>\s(.+)/);
      if (match) {
        const text = match[1].replace(/^"|"$/g, "");
        const name = match[2].trim();
        const existing = store.fsResolvePath(name, cwdId);
        if (existing?.type === "file") {
          store.fsWrite(existing.id, text);
        } else {
          store.fsTouch(cwdId, name, text);
        }
        return { output: [`${prompt} ${input}`] };
      }
      // Just echo text
      return { output: [`${prompt} ${input}`, args.replace(/^"|"$/g, "")] };
    }

    case "whoami":
      return { output: [`${prompt} ${input}`, store.username || "user"] };

    case "date":
      return { output: [`${prompt} ${input}`, new Date().toString()] };

    case "hostname":
      return { output: [`${prompt} ${input}`, "webos"] };

    case "neofetch":
      return {
        output: [
          `${prompt} ${input}`,
          "",
          "   ╔══════════════╗    " + (store.username || "user") + "@webos",
          "   ║  ██████████  ║    ──────────────────",
          "   ║  ██ BWOS ██  ║    OS: Better Windows Web OS 3.0.0",
          "   ║  ██████████  ║    Kernel: React " + "18.x",
          "   ║              ║    Shell: webos-terminal",
          "   ║  ⊞ Windows   ║    Theme: " + store.theme,
          "   ╚══════════════╝    Resolution: " + window.innerWidth + "x" + window.innerHeight,
          "                       Font: " + store.fontFamily,
          "                       Sound: " + store.soundScheme,
          "                       Windows: " + store.windows.length + " open",
          "                       Uptime: " + Math.floor((Date.now() % 86400000) / 60000) + " min",
          "",
        ],
      };

    case "clear":
      return { output: [], clear: true };

    default:
      return { output: [`${prompt} ${input}`, `${cmd}: command not found. Type 'help' for available commands.`] };
  }
};
