import { useStore } from "../state/store";

const emitCloseContextMenus = () => {
  window.dispatchEvent(new CustomEvent("webos:close-context-menus"));
};

const isInputFocused = (e: KeyboardEvent) => {
  const tag = (e.target as HTMLElement)?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
};

export const registerHotkeys = () => {
  // Track Meta key for single-press start menu toggle
  let metaDown = false;
  let metaUsedAsCombo = false;

  const onKeyDown = (event: KeyboardEvent) => {
    const state = useStore.getState();

    // Locked: only allow unlock interaction
    if (state.locked) return;

    // Track Meta key state
    if (event.key === "Meta") {
      metaDown = true;
      metaUsedAsCombo = false;
      return;
    }
    if (metaDown) metaUsedAsCombo = true;

    // Escape: dismiss overlays
    if (event.key === "Escape") {
      state.setStartMenuOpen(false);
      state.setSidebarOpen(false);
      state.setLauncherOpen(false);
      if (state.matrixActive) state.toggleMatrix();
      if (state.coffeeBreakActive) state.setCoffeeBreak(false);
      if (state.updateActive) state.setUpdateScreen(false);
      if (state.gravityActive) state.setGravity(false);
      if (state.pulseUiActive) state.setPulseUi(false);
      emitCloseContextMenus();
      return;
    }

    // Alt+F4: close focused window
    if (event.altKey && event.key === "F4") {
      event.preventDefault();
      if (state.focusedWindowId) {
        state.closeWindow(state.focusedWindowId);
      }
      return;
    }

    // Alt+Tab: cycle windows
    if (event.altKey && event.key === "Tab") {
      event.preventDefault();
      state.cycleWindows();
      return;
    }

    // Ctrl+Shift+Esc: open System Monitor
    if (event.ctrlKey && event.shiftKey && event.key === "Escape") {
      event.preventDefault();
      state.openWindow("sysmonitor");
      return;
    }

    // Ctrl+W: close focused window
    if (event.ctrlKey && event.key.toLowerCase() === "w") {
      event.preventDefault();
      if (state.focusedWindowId) {
        state.closeWindow(state.focusedWindowId);
      }
      return;
    }

    // Ctrl+Space: app launcher
    if (event.ctrlKey && event.key === " ") {
      event.preventDefault();
      state.setLauncherOpen(!state.launcherOpen);
      return;
    }

    // Meta+L or Ctrl+L (outside inputs): lock screen
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
      if (isInputFocused(event)) return;
      event.preventDefault();
      state.lock();
      return;
    }

    // Ctrl+Shift+R: reset window layout
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "r") {
      event.preventDefault();
      state.resetWindowLayout();
      return;
    }

    // Ctrl+Shift+M: toggle mute
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "m") {
      event.preventDefault();
      state.toggleMute();
      return;
    }

    // Ctrl+Shift+D: toggle DND
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
      event.preventDefault();
      state.setDndMode(!state.dndMode);
      return;
    }

    // Ctrl+N: new window of focused app (outside text inputs)
    if (event.ctrlKey && event.key.toLowerCase() === "n") {
      if (isInputFocused(event)) return;
      event.preventDefault();
      if (state.focusedWindowId) {
        const win = state.windows.find((w) => w.id === state.focusedWindowId);
        if (win) state.openWindow(win.appId);
      }
      return;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    const state = useStore.getState();
    if (state.locked) return;

    // Meta key alone (no combo): toggle start menu
    if (event.key === "Meta" && metaDown && !metaUsedAsCombo) {
      state.setStartMenuOpen(!state.startMenuOpen);
    }
    if (event.key === "Meta") {
      metaDown = false;
      metaUsedAsCombo = false;
    }
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
};
