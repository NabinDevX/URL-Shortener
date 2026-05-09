export interface ClientOriginInfo {
  platform: string;
  origin: string;
}

type CapacitorLike = {
  getPlatform?: () => string;
  isNativePlatform?: () => boolean;
};

export const getClientOrigin = async (): Promise<ClientOriginInfo> => {
  if (typeof window === "undefined") {
    return { platform: "server", origin: "" };
  }

  const origin = window.location?.origin ?? "";
  const capacitor = (
    globalThis as typeof globalThis & { Capacitor?: CapacitorLike }
  ).Capacitor;

  if (capacitor) {
    const platform =
      typeof capacitor.getPlatform === "function"
        ? capacitor.getPlatform()
        : typeof capacitor.isNativePlatform === "function" &&
            capacitor.isNativePlatform()
          ? "native"
          : "web";

    return { platform: platform || "web", origin };
  }

  const inferredPlatform = origin.includes("capacitor") ? "native" : "web";
  return { platform: inferredPlatform, origin };
};
