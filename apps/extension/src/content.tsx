import widgetCss from "./index.css?inline";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import ContentPage from "./content/content";

if (!document.getElementById("url-shortener-shadow-host")) {
  const host = document.createElement("div");
  host.id = "url-shortener-shadow-host";
  host.style.cssText =
    "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647;";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = widgetCss;

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;inset:0;pointer-events:none;";
  shadow.appendChild(style);
  shadow.appendChild(container);

  createRoot(container).render(
    <StrictMode>
      <ContentPage />
    </StrictMode>
  );
}
