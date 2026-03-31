declare module "@crxjs/vite-plugin" {
  import type { PluginOption } from "vite";
  export function crx(...args: unknown[]): PluginOption;
}
