export interface ClientOriginInfo {
  platform: string;
  origin: string;
}

export const getClientOrigin = async (): Promise<ClientOriginInfo> => {
  if (typeof window === "undefined") {
    return { platform: "server", origin: "" };
  }

  const origin = window.location?.origin ?? "";

  try {
    const { Capacitor } = await import("@capacitor/core");
    const platform =
      typeof Capacitor?.getPlatform === "function"
        ? (Capacitor.getPlatform() as string)
        : typeof Capacitor?.isNativePlatform === "function" &&
            Capacitor.isNativePlatform()
          ? "native"
          : "web";

    return { platform: platform || "web", origin };
  } catch (err) {
    // Capacitor not available in web build — infer from origin
    const inferredPlatform = origin.includes("capacitor") ? "native" : "web";
    return { platform: inferredPlatform, origin };
  }
};
