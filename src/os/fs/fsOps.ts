import { createId } from "../utils/id";
import type { FsNode, FsState } from "./fsTypes";

const splitPath = (path: string) =>
  path
    .replace(/^~\//, "Desktop/")
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean);

export const getNode = (state: FsState, id?: string) =>
  id ? state.nodes[id] : undefined;

export const findChildByName = (
  state: FsState,
  parentId: string,
  name: string
) => {
  const parent = state.nodes[parentId];
  if (!parent || parent.type !== "folder" || !parent.children) return undefined;
  return parent.children
    .map((childId) => state.nodes[childId])
    .find(
      (node) =>
        node?.name.toLowerCase() === name.toLowerCase() && !node.deleted
    );
};

export const resolvePath = (
  state: FsState,
  path: string,
  cwdId: string
): FsNode | undefined => {
  if (!path || path === ".") return state.nodes[cwdId];
  if (path === "~") {
    const desktop = findChildByName(state, state.rootId, "Desktop");
    return desktop;
  }

  let current = path.startsWith("/") ? state.nodes[state.rootId] : state.nodes[cwdId];
  const parts = splitPath(path);

  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") {
      if (current.parentId) {
        current = state.nodes[current.parentId];
      }
      continue;
    }
    if (!current.children) return undefined;
    const next = findChildByName(state, current.id, part);
    if (!next) return undefined;
    current = next;
  }
  return current;
};

export const listFolder = (state: FsState, folderId: string): FsNode[] => {
  const folder = state.nodes[folderId];
  if (!folder || folder.type !== "folder" || !folder.children) return [];
  return folder.children
    .map((id) => state.nodes[id])
    .filter((node) => node && !node.deleted);
};

export const makeFolder = (state: FsState, parentId: string, name: string) => {
  const parent = state.nodes[parentId];
  if (!parent || parent.type !== "folder") return state;
  if (findChildByName(state, parentId, name)) return state;
  const newNode: FsNode = {
    id: createId("folder"),
    name,
    type: "folder",
    parentId,
    children: [],
  };
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [parent.id]: {
        ...parent,
        children: [...(parent.children ?? []), newNode.id],
      },
      [newNode.id]: newNode,
    },
  };
};

export const makeFile = (
  state: FsState,
  parentId: string,
  name: string,
  content = ""
) => {
  const parent = state.nodes[parentId];
  if (!parent || parent.type !== "folder") return state;
  if (findChildByName(state, parentId, name)) return state;
  const newNode: FsNode = {
    id: createId("file"),
    name,
    type: "file",
    parentId,
    content,
  };
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [parent.id]: {
        ...parent,
        children: [...(parent.children ?? []), newNode.id],
      },
      [newNode.id]: newNode,
    },
  };
};

export const renameNode = (state: FsState, id: string, name: string) => {
  const node = state.nodes[id];
  if (!node) return state;
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [id]: { ...node, name },
    },
  };
};

export const deleteNode = (state: FsState, id: string) => {
  const node = state.nodes[id];
  if (!node || node.deleted) return state;
  const parent = node.parentId ? state.nodes[node.parentId] : undefined;
  const nextNodes = { ...state.nodes };
  if (parent && parent.children) {
    parent.children = parent.children.filter((childId) => childId !== id);
    nextNodes[parent.id] = parent;
  }
  nextNodes[id] = {
    ...node,
    deleted: true,
    originalParentId: node.parentId,
    parentId: undefined,
  };
  return {
    ...state,
    nodes: nextNodes,
    recycleBin: [...state.recycleBin, id],
  };
};

export const restoreNode = (state: FsState, id: string) => {
  const node = state.nodes[id];
  if (!node || !node.deleted || !node.originalParentId) return state;
  const parent = state.nodes[node.originalParentId];
  if (!parent || parent.type !== "folder") return state;
  parent.children = [...(parent.children ?? []), id];
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [parent.id]: parent,
      [id]: {
        ...node,
        deleted: false,
        parentId: node.originalParentId,
        originalParentId: undefined,
      },
    },
    recycleBin: state.recycleBin.filter((item) => item !== id),
  };
};

export const emptyRecycleBin = (state: FsState) => {
  const nextNodes = { ...state.nodes };
  state.recycleBin.forEach((id) => {
    delete nextNodes[id];
  });
  return {
    ...state,
    nodes: nextNodes,
    recycleBin: [],
  };
};

export const writeFile = (state: FsState, id: string, content: string) => {
  const node = state.nodes[id];
  if (!node || node.type !== "file") return state;
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [id]: { ...node, content },
    },
  };
};

export const copyNode = (state: FsState, id: string, targetParentId: string): FsState => {
  const node = state.nodes[id];
  const target = state.nodes[targetParentId];
  if (!node || !target || target.type !== "folder") return state;

  const newNode: FsNode = {
    id: createId(node.type),
    name: node.name,
    type: node.type,
    parentId: targetParentId,
    content: node.content,
    children: node.type === "folder" ? [] : undefined,
  };

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [target.id]: {
        ...target,
        children: [...(target.children ?? []), newNode.id],
      },
      [newNode.id]: newNode,
    },
  };
};

export const moveNode = (state: FsState, id: string, newParentId: string) => {
  const node = state.nodes[id];
  const newParent = state.nodes[newParentId];
  if (!node || !newParent || newParent.type !== "folder") return state;
  const nextNodes = { ...state.nodes };

  if (node.parentId) {
    const oldParent = nextNodes[node.parentId];
    if (oldParent?.children) {
      oldParent.children = oldParent.children.filter((childId) => childId !== id);
      nextNodes[oldParent.id] = oldParent;
    }
  }

  newParent.children = [...(newParent.children ?? []), id];
  nextNodes[newParent.id] = newParent;
  nextNodes[id] = { ...node, parentId: newParentId };

  return {
    ...state,
    nodes: nextNodes,
  };
};
