import { useStore } from "../state/store";

const emitCloseContextMenus = () => {
  window.dispatchEvent(new CustomEvent("webos:close-context-menus"));
};

export const registerHotkeys = () => {
  const onKeyDown = (event: KeyboardEvent) => {
    const state = useStore.getState();
    if (event.key === "Escape") {
      state.setStartMenuOpen(false);
      state.setSidebarOpen(false);
      if (state.matrixActive) state.toggleMatrix();
      if (state.coffeeBreakActive) state.setCoffeeBreak(false);
      if (state.updateActive) state.setUpdateScreen(false);
      if (state.gravityActive) state.setGravity(false);
      if (state.pulseUiActive) state.setPulseUi(false);
      emitCloseContextMenus();
      return;
    }

    if (event.altKey && event.key === "Tab") {
      event.preventDefault();
      state.cycleWindows();
      return;
    }

    if (event.ctrlKey && event.key.toLowerCase() === "w") {
      event.preventDefault();
      if (state.focusedWindowId) {
        state.closeWindow(state.focusedWindowId);
      }
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
};
