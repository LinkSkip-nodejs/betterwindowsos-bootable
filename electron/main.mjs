import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Force resolve to Electron's built-in module, not the npm wrapper
const require = createRequire(import.meta.url);
const electronPath = require.resolve("electron");
delete require.cache[electronPath];

// Temporarily hide the npm electron package so the built-in resolves
const Module = require("node:module");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "electron") {
    return "electron";
  }
  return origResolve.call(this, request, parent, isMain, options);
};

const electron = require("electron");
Module._resolveFilename = origResolve;

const { app, BrowserWindow } = electron;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.ELECTRON_DEV === "true";
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
