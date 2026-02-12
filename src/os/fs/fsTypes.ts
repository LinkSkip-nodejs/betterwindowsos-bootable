export type FsNodeType = "folder" | "file";

export type FsNode = {
  id: string;
  name: string;
  type: FsNodeType;
  parentId?: string;
  children?: string[];
  content?: string;
  deleted?: boolean;
  originalParentId?: string;
};

export type FsState = {
  rootId: string;
  nodes: Record<string, FsNode>;
  recycleBin: string[];
};
