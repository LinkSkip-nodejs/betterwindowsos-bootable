import { createId } from "../utils/id";
import type { FsNode, FsState } from "./fsTypes";

const createFolder = (name: string, parentId?: string): FsNode => ({
  id: createId("folder"),
  name,
  type: "folder",
  parentId,
  children: [],
});

const createFile = (name: string, content = "", parentId?: string): FsNode => ({
  id: createId("file"),
  name,
  type: "file",
  parentId,
  content,
});

export const createInitialFs = (): FsState => {
  const root: FsNode = {
    id: "root",
    name: "root",
    type: "folder",
    children: [],
  };

  const desktop = createFolder("Desktop", root.id);
  const documents = createFolder("Documents", root.id);
  const downloads = createFolder("Downloads", root.id);
  const pictures = createFolder("Pictures", root.id);

  const desktopReadme = createFile(
    "welcome.txt",
    "This is your desktop. Double-click to open files.",
    desktop.id
  );
  const desktopNotes = createFile(
    "notes.txt",
    "- Add more games\\n- Customize wallpaper\\n- Record the YouTube demo",
    desktop.id
  );
  const emptyFolder = createFolder("Empty Folder", desktop.id);
  const readme = createFile(
    "readme.txt",
    "Welcome to Better Windows Web OS!",
    documents.id
  );
  const ideas = createFile(
    "video-ideas.txt",
    "- Build a web OS\\n- Make a synthwave wallpaper\\n- Add silly easter eggs",
    documents.id
  );

  root.children = [desktop.id, documents.id, downloads.id, pictures.id];
  desktop.children = [desktopReadme.id, desktopNotes.id, emptyFolder.id];
  documents.children = [readme.id, ideas.id];
  downloads.children = [];
  pictures.children = [];

  const nodes: Record<string, FsNode> = {
    [root.id]: root,
    [desktop.id]: desktop,
    [documents.id]: documents,
    [downloads.id]: downloads,
    [pictures.id]: pictures,
    [desktopReadme.id]: desktopReadme,
    [desktopNotes.id]: desktopNotes,
    [emptyFolder.id]: emptyFolder,
    [readme.id]: readme,
    [ideas.id]: ideas,
  };

  return {
    rootId: root.id,
    nodes,
    recycleBin: [],
  };
};
