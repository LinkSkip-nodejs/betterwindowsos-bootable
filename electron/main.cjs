const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const { exec } = require("child_process");
const http = require("http");
const fs = require("fs");

let mainWindow;
const isDev = process.env.ELECTRON_DEV === "true";
const LOCAL_PORT = 17839; // Fixed port so localStorage persists across restarts

/* ── WiFi scanning ──────────────────────────────────────────── */

function parseWindowsNetworks(output) {
  const networks = [];
  const blocks = output.split(/\n(?=SSID\s+\d*\s*:)/);
  for (const block of blocks) {
    const ssidMatch = block.match(/SSID\s+\d*\s*:\s*(.+)/);
    const authMatch = block.match(/Authentication\s*:\s*(.+)/);
    const signalMatch = block.match(/Signal\s*:\s*(\d+)%/);
    if (ssidMatch && ssidMatch[1].trim()) {
      networks.push({
        ssid: ssidMatch[1].trim(),
        signal: signalMatch ? parseInt(signalMatch[1], 10) : 50,
        secured: authMatch ? !authMatch[1].trim().toLowerCase().includes("open") : true,
        connected: false,
      });
    }
  }
  return networks;
}

function parseLinuxNetworks(output) {
  const networks = [];
  const lines = output.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    // nmcli -t -f SSID,SIGNAL,SECURITY dev wifi list
    const parts = line.split(":");
    if (parts.length >= 3 && parts[0].trim()) {
      networks.push({
        ssid: parts[0].trim(),
        signal: parseInt(parts[1], 10) || 50,
        secured: parts[2].trim() !== "" && parts[2].trim() !== "--",
        connected: false,
      });
    }
  }
  return networks;
}

function scanWifi() {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    const cmd = isWin
      ? "netsh wlan show networks mode=bssid"
      : "nmcli -t -f SSID,SIGNAL,SECURITY dev wifi list --rescan yes";

    exec(cmd, { timeout: 10000 }, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }
      const networks = isWin
        ? parseWindowsNetworks(stdout)
        : parseLinuxNetworks(stdout);
      // De-duplicate by SSID (keep strongest signal)
      const seen = new Map();
      for (const n of networks) {
        if (!seen.has(n.ssid) || seen.get(n.ssid).signal < n.signal) {
          seen.set(n.ssid, n);
        }
      }
      resolve(Array.from(seen.values()).sort((a, b) => b.signal - a.signal));
    });
  });
}

function connectToWifi(ssid, password) {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    let cmd;
    if (isWin) {
      if (password) {
        // Create a temp profile XML for secured networks
        const profileXml = `<?xml version="1.0"?>
<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">
  <name>${ssid}</name>
  <SSIDConfig><SSID><name>${ssid}</name></SSID></SSIDConfig>
  <connectionType>ESS</connectionType>
  <connectionMode>auto</connectionMode>
  <MSM><security>
    <authEncryption><authentication>WPA2PSK</authentication><encryption>AES</encryption><useOneX>false</useOneX></authEncryption>
    <sharedKey><keyType>passPhrase</keyType><protected>false</protected><keyMaterial>${password}</keyMaterial></sharedKey>
  </security></MSM>
</WLANProfile>`;
        const tmpFile = path.join(app.getPath("temp"), "wifi-profile.xml");
        require("fs").writeFileSync(tmpFile, profileXml, "utf-8");
        cmd = `netsh wlan add profile filename="${tmpFile}" && netsh wlan connect name="${ssid}"`;
      } else {
        cmd = `netsh wlan connect name="${ssid}"`;
      }
    } else {
      cmd = password
        ? `nmcli dev wifi connect "${ssid}" password "${password}"`
        : `nmcli dev wifi connect "${ssid}"`;
    }

    exec(cmd, { timeout: 15000 }, (error) => {
      resolve(!error);
    });
  });
}

function disconnectWifi() {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    if (isWin) {
      exec("netsh wlan disconnect", { timeout: 10000 }, (error) => {
        resolve(!error);
      });
    } else {
      // Find the real wireless interface and disconnect it
      exec("nmcli -t -f DEVICE,TYPE dev | grep ':wifi$'", { timeout: 5000 }, (err, stdout) => {
        const iface = stdout?.split(":")[0]?.trim();
        if (!iface) { resolve(false); return; }
        exec(`nmcli dev disconnect "${iface}"`, { timeout: 10000 }, (error) => {
          resolve(!error);
        });
      });
    }
  });
}

function getCurrentWifi() {
  return new Promise((resolve) => {
    const isWin = process.platform === "win32";
    const cmd = isWin
      ? "netsh wlan show interfaces"
      : "nmcli -t -f ACTIVE,SSID dev wifi";

    exec(cmd, { timeout: 5000 }, (error, stdout) => {
      if (error) { resolve(null); return; }
      if (isWin) {
        const match = stdout.match(/\bSSID\s*:\s*(.+)/);
        resolve(match ? match[1].trim() : null);
      } else {
        const activeLine = stdout.split("\n").find((l) => l.startsWith("yes:"));
        resolve(activeLine ? activeLine.split(":")[1] : null);
      }
    });
  });
}

/* ── IPC handlers ───────────────────────────────────────────── */

ipcMain.handle("wifi:scan", async () => {
  return await scanWifi();
});

ipcMain.handle("wifi:connect", async (_event, ssid, password) => {
  return await connectToWifi(ssid, password);
});

ipcMain.handle("wifi:disconnect", async () => {
  return await disconnectWifi();
});

ipcMain.handle("wifi:current", async () => {
  return await getCurrentWifi();
});

/* ── Local static server for production ─────────────────────── */

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function startLocalServer() {
  return new Promise((resolve) => {
    const distDir = path.join(__dirname, "..", "dist");
    const server = http.createServer((req, res) => {
      let filePath = path.join(distDir, req.url === "/" ? "index.html" : req.url);
      // If the file doesn't exist, serve index.html (SPA fallback)
      if (!fs.existsSync(filePath)) {
        filePath = path.join(distDir, "index.html");
      }
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    // Fixed port so localStorage persists across restarts (same origin)
    server.listen(LOCAL_PORT, "127.0.0.1", () => {
      console.log(`Local server running on http://localhost:${LOCAL_PORT}`);
      resolve(LOCAL_PORT);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    fullscreen: true,
    kiosk: !isDev,
    closable: isDev,
    minimizable: isDev,
    maximizable: true,
    skipTaskbar: !isDev,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      devTools: isDev,
    },
  });

  // In dev, load from Vite dev server; in prod, serve built files via local HTTP
  // (Google OAuth requires http:// origin, file:// is not allowed)
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    startLocalServer().then((port) => {
      mainWindow.loadURL(`http://localhost:${port}`);
    });
  }

  // Intercept OAuth redirects in webviews before they cause ERR_CONNECTION_REFUSED
  app.on("web-contents-created", (_event, contents) => {
    if (contents.getType() === "webview") {
      contents.on("will-navigate", (event, url) => {
        if (url.startsWith("http://localhost/oauth2callback")) {
          event.preventDefault();
          // Forward the token URL back to the renderer via the main window
          mainWindow.webContents.send("oauth-callback", url);
        }
      });
      contents.on("will-redirect", (event, url) => {
        if (url.startsWith("http://localhost/oauth2callback")) {
          event.preventDefault();
          mainWindow.webContents.send("oauth-callback", url);
        }
      });
    }
  });

  // In kiosk/production mode, lock it down
  if (!isDev) {
    // Prevent the window from being closed
    mainWindow.on("close", (e) => {
      e.preventDefault();
    });

    // Keep fullscreen — re-enter if somehow exited
    mainWindow.on("leave-full-screen", () => {
      mainWindow.setFullScreen(true);
    });

    // Block keyboard shortcuts that could escape the app
    mainWindow.webContents.on("before-input-event", (event, input) => {
      // Block F11 (toggle fullscreen), Alt+F4 (close), Ctrl+W (close tab)
      if (input.key === "F11") event.preventDefault();
      if (input.alt && input.key === "F4") event.preventDefault();
      if (input.control && input.key === "w") event.preventDefault();
      // Block Ctrl+Shift+I (devtools)
      if (input.control && input.shift && input.key === "I") event.preventDefault();
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  // In production, register global shortcuts to block escape attempts
  if (!isDev) {
    // Block Alt+Tab at the app level (X server config handles the rest)
    globalShortcut.register("Alt+Tab", () => {});
    globalShortcut.register("Alt+F4", () => {});
    globalShortcut.register("Super+D", () => {});
    globalShortcut.register("CommandOrControl+Q", () => {});
  }
});

app.on("window-all-closed", () => {
  if (isDev) {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
