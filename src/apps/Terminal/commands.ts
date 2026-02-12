import type { FsNode } from "../../os/fs/fsTypes";
import type { StoreState } from "../../os/state/store";

type CommandResult = {
  output: string[];
  nextCwd?: string;
  clear?: boolean;
};

const formatPrompt = (path: string) => `user@webos:~/${path}$`;

const getPathName = (node: FsNode | undefined, rootName: string) => {
  if (!node) return rootName;
  if (!node.parentId) return "";
  return node.name;
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
  const cwdNode = store.fs.nodes[cwdId];
  const cwdPath = getPathName(cwdNode, "root");
  const prompt = formatPrompt(cwdPath);

  switch (cmd) {
    case "secret":
      return {
        output: [
          `${prompt} ${input}`,
          "SECRET COMMANDS DETECTED:",
          "matrix - entering the mainframe",
          "coffee break - you deserve it",
          "update - system maintenance",
          "gravity on - unleash physics",
          "gravity off - restore order",
          "pulse ui - make the system breathe",
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
      if (args === "on") {
        store.setGravity(true);
        return { output: [`${prompt} ${input}`, "Gravity enabled"] };
      }
      if (args === "off") {
        store.setGravity(false);
        return { output: [`${prompt} ${input}`, "Gravity disabled"] };
      }
      return { output: [`${prompt} ${input}`, "Usage: gravity <on/off>"] };
    case "pulse":
      if (args === "ui") {
        store.setPulseUi(!store.pulseUiActive);
        return { output: [`${prompt} ${input}`, "Pulse UI toggled"] };
      }
      return { output: [`${prompt} ${input}`, "Usage: pulse ui"] };
    case "help":
      return {
        output: [
          `${prompt} ${input}`,
          "help, ls, cd <path>, mkdir <name>, touch <name>, cat <name>, echo <text> > <name>, clear",
        ],
      };
    case "ls": {
      const nodes = store.fsList(cwdId);
      return {
        output: [`${prompt} ${input}`, nodes.map((n) => n.name).join("  ")],
      };
    }
    case "cd": {
      const target = args || "~";
      const next = store.fsResolvePath(target, cwdId);
      if (next?.type === "folder") {
        return {
          output: [`${prompt} ${input}`],
          nextCwd: next.id,
        };
      }
      return { output: [`${prompt} ${input}`, "Path not found"] };
    }
    case "mkdir":
      if (args) {
        store.fsMkdir(cwdId, args);
      }
      return { output: [`${prompt} ${input}`] };
    case "touch":
      if (args) {
        store.fsTouch(cwdId, args, "");
      }
      return { output: [`${prompt} ${input}`] };
    case "cat": {
      const node = store.fsResolvePath(args, cwdId);
      if (node?.type === "file") {
        return { output: [`${prompt} ${input}`, node.content ?? ""] };
      }
      return { output: [`${prompt} ${input}`, "File not found"] };
    }
    case "echo": {
      const match = args.match(/(.*)\s>\s(.+)/);
      if (match) {
        const text = match[1].replace(/^"|"$/g, "");
        const name = match[2];
        const existing = store.fsResolvePath(name, cwdId);
        if (existing?.type === "file") {
          store.fsWrite(existing.id, text);
        } else {
          store.fsTouch(cwdId, name, text);
        }
        return { output: [`${prompt} ${input}`] };
      }
      return { output: [`${prompt} ${input}`] };
    }
    case "clear":
      return { output: [], clear: true };
    default:
      return { output: [`${prompt} ${input}`, "Command not found"] };
  }
};
