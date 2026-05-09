import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "URLTinier",
  description:
    "Shorten your links, broaden your reach. Built with global routing, real-time analytics, and enterprise-grade governance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#f8fafc" />
      </head>
      <body className="bg-surface font-body text-on-surface">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV !== "development" && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `const originalTitle = document.title;

const messages = [
  "👀 Hey, where are you?",
  "⬅️ Come back!",
  "🥺 Don’t leave this tab!",
  "✨ This tab needs you!"
];

let index = 0;
let loopInterval = null;

function startLoop() {
  if (loopInterval) return;
  loopInterval = setInterval(() => {
    document.title = messages[index];
    index = (index + 1) % messages.length;
  }, 1000);
}

function stopLoop() {
  clearInterval(loopInterval);
  loopInterval = null;
  document.title = originalTitle;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) startLoop();
  else stopLoop();
});`,
              }}
            />

            <script
              dangerouslySetInnerHTML={{
                __html: `const isLocalhost =
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

if (!isLocalhost) {
  document.addEventListener("contextmenu", e => e.preventDefault());

  document.addEventListener("keydown", function (e) {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
      (e.ctrlKey && e.key === "U")
    ) {
      e.preventDefault();
    }
  });

  setInterval(function () {
    if (
      window.outerWidth - window.innerWidth > 160 ||
      window.outerHeight - window.innerHeight > 160
    ) {
      console.clear();
      document.body.innerHTML = "";
    }
  }, 1000);
}`,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
