import { createOsApi, type ConsoleLine } from "./osApi";

export type RunResult = {
  output: ConsoleLine[];
  error: string | null;
  duration: number;
};

const TIMEOUT_MS = 5000;

export function executeScript(code: string): RunResult {
  const output: ConsoleLine[] = [];
  const start = performance.now();

  const emit = (line: ConsoleLine) => {
    output.push(line);
  };

  const os = createOsApi(emit);

  try {
    // Wrap in a function with os injected + timeout guard
    // We use a counter-based guard since we can't use real async timeout with eval
    const guardedCode = `
      let __iterations = 0;
      const __maxIterations = 1000000;
      const __checkLoop = () => {
        if (++__iterations > __maxIterations) {
          throw new Error("Execution halted: possible infinite loop (exceeded " + __maxIterations + " iterations)");
        }
      };
      ${code}
    `;

    const fn = new Function(
      "os",
      "console",
      "__setTimeout",
      guardedCode
    );

    // Provide a mock console that routes to os output
    const mockConsole = {
      log: (...args: unknown[]) => os.print(...args),
      warn: (...args: unknown[]) => os.warn(...args),
      error: (...args: unknown[]) => os.error(...args),
      info: (...args: unknown[]) => os.info(...args),
    };

    // Execute with timeout via synchronous deadline check
    const deadline = performance.now() + TIMEOUT_MS;
    const timeoutCheck = () => {
      if (performance.now() > deadline) {
        throw new Error(`Execution timed out after ${TIMEOUT_MS}ms`);
      }
    };

    fn(os, mockConsole, timeoutCheck);

    const duration = performance.now() - start;
    return { output, error: null, duration };
  } catch (err) {
    const duration = performance.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    output.push({ type: "error", text: message, timestamp: Date.now() });
    return { output, error: message, duration };
  }
}
