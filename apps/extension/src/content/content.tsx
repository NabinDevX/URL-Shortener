import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_PREFIX || "/api/v1";
const TEMP_SHORTENER = "https://is.gd/create.php?format=simple&url=";

const tokenKey = "urlShortenerAccessToken";
const userKey = "urlShortenerUser";
const floatModeKey = "urlShortenerFloatMode";
const floatPositionKey = "urlShortenerFloatPosition";
const viewportGap = 12;
const minimizedButtonSize = 42;

type ContentPageProps = {
  embedded?: boolean;
};

type StorageResult = Record<string, unknown>;

type ChromeStorageLocal = {
  get: (keys: string[], cb: (result: StorageResult) => void) => void;
  set: (payload: Record<string, unknown>, cb: () => void) => void;
  remove: (keys: string[], cb: () => void) => void;
};

type ChromeTab = {
  url?: string;
};

type ChromeTabs = {
  query: (
    queryInfo: { active: boolean; currentWindow: boolean },
    cb: (tabs: ChromeTab[]) => void
  ) => void;
};

const chromeApi = (
  globalThis as typeof globalThis & {
    chrome?: { storage?: { local?: ChromeStorageLocal }; tabs?: ChromeTabs };
  }
).chrome;

const chromeStorage = chromeApi?.storage?.local;
const chromeTabs = chromeApi?.tabs;

type StorageChanges = Record<
  string,
  { oldValue?: unknown; newValue?: unknown }
>;

const chromeOnChanged = (
  globalThis as typeof globalThis & {
    chrome?: {
      storage?: {
        onChanged?: {
          addListener: (cb: (changes: StorageChanges) => void) => void;
          removeListener: (cb: (changes: StorageChanges) => void) => void;
        };
      };
    };
  }
).chrome?.storage?.onChanged;

type VisitItem = {
  timestamp: string;
};

type UrlItem = {
  _id?: string;
  shortId: string;
  isDeleted?: boolean;
  createdAt: string;
  visitHistory?: VisitItem[];
};

type AuthUser = {
  _id?: string;
  name?: string;
  email?: string;
};

type WidgetPosition = {
  left: number;
  top: number;
};

const clampValue = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(value, max));

const clampPosition = (
  position: WidgetPosition,
  width: number,
  height: number
): WidgetPosition => ({
  left: clampValue(
    position.left,
    viewportGap,
    window.innerWidth - width - viewportGap
  ),
  top: clampValue(
    position.top,
    viewportGap,
    window.innerHeight - height - viewportGap
  ),
});

const getMinimizedPositionFromRect = (rect: DOMRect): WidgetPosition => {
  const left =
    rect.left + rect.width / 2 <= window.innerWidth / 2
      ? viewportGap
      : window.innerWidth - minimizedButtonSize - viewportGap;

  return {
    left,
    top: clampValue(
      rect.top,
      viewportGap,
      window.innerHeight - minimizedButtonSize - viewportGap
    ),
  };
};

const loadFromStorage = async (keys: string[]): Promise<StorageResult> =>
  new Promise((resolve) => {
    if (!chromeStorage) {
      resolve({});
      return;
    }
    chromeStorage.get(keys, (result: StorageResult) => resolve(result));
  });

const saveToStorage = async (payload: Record<string, unknown>): Promise<void> =>
  new Promise((resolve) => {
    if (!chromeStorage) {
      resolve();
      return;
    }
    chromeStorage.set(payload, () => resolve());
  });

const clearStorage = async (keys: string[]): Promise<void> =>
  new Promise((resolve) => {
    if (!chromeStorage) {
      resolve();
      return;
    }
    chromeStorage.remove(keys, () => resolve());
  });

const getErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: string };
    return body?.message || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const buildAuthHeaders = (token: string): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const shortDate = (value: string): string => new Date(value).toLocaleString();

const createQrUrl = (shortId: string): string =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://urltinier.app/${shortId}`)}`;

const getActiveTabUrl = async (): Promise<string | null> =>
  new Promise((resolve) => {
    if (!chromeTabs) {
      resolve(null);
      return;
    }

    chromeTabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeUrl = tabs[0]?.url;
      resolve(activeUrl && /^https?:\/\//.test(activeUrl) ? activeUrl : null);
    });
  });

export default function ContentPage({ embedded = false }: ContentPageProps) {
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const minimizedButtonDraggedRef = useRef(false);
  const initialUrl = embedded ? "" : window.location.href;

  const [storageLoaded, setStorageLoaded] = useState(false);
  const [isFloatMode, setIsFloatMode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<WidgetPosition | null>(null);
  const [message, setMessage] = useState("");

  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [tempUrl, setTempUrl] = useState(initialUrl);
  const [tempShortUrl, setTempShortUrl] = useState("");
  const [creatingTemp, setCreatingTemp] = useState(false);

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [customShortId, setCustomShortId] = useState("");
  const [creatingShort, setCreatingShort] = useState(false);

  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [qrOpenFor, setQrOpenFor] = useState("");

  const activeUrls = useMemo(
    () => urls.filter((item) => item.isDeleted !== true),
    [urls]
  );

  const minimizeWidget = (): void => {
    const widget = widgetRef.current;

    if (widget) {
      setPosition(getMinimizedPositionFromRect(widget.getBoundingClientRect()));
    }

    setIsMinimized(true);
  };

  useEffect(() => {
    let alive = true;

    void (async () => {
      if (embedded) {
        const activeTabUrl = await getActiveTabUrl();
        if (alive && activeTabUrl) {
          setTempUrl(activeTabUrl);
          setUrlInput(activeTabUrl);
        }
      }

      const storage = await loadFromStorage([
        tokenKey,
        userKey,
        floatModeKey,
        floatPositionKey,
      ]);
      if (!alive) {
        return;
      }

      const storedToken = (storage[tokenKey] as string | undefined) || "";
      const storedUser = (storage[userKey] as AuthUser | undefined) || null;
      const storedFloatMode =
        (storage[floatModeKey] as boolean | undefined) === true;
      const storedPosition =
        (storage[floatPositionKey] as WidgetPosition | undefined) ?? null;

      if (storedToken) {
        setToken(storedToken);
      }
      if (storedUser) {
        setUser(storedUser);
      }
      setIsFloatMode(storedFloatMode);
      if (!embedded && storedFloatMode && storedPosition) {
        setPosition(storedPosition);
      }
      setStorageLoaded(true);
    })();

    return () => {
      alive = false;
    };
  }, [embedded]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void fetchUrls(token);
  }, [token]);

  useEffect(() => {
    if (!chromeOnChanged) {
      return;
    }

    const listener = (changes: StorageChanges): void => {
      if (floatModeKey in changes) {
        const enabled = changes[floatModeKey].newValue === true;
        setIsFloatMode(enabled);
        if (enabled) {
          setIsMinimized(false);
        } else {
          setIsMinimized(false);
          setPosition(null);
        }
      }
      if (!embedded && floatPositionKey in changes) {
        const newPos = changes[floatPositionKey]
          .newValue as WidgetPosition | null;
        if (newPos) {
          setPosition(newPos);
        }
      }
    };

    chromeOnChanged.addListener(listener);
    return () => {
      chromeOnChanged.removeListener(listener);
    };
  }, [embedded]);

  useEffect(() => {
    if (embedded) {
      return;
    }

    const syncFloatState = (): void => {
      void (async () => {
        const storage = await loadFromStorage([floatModeKey, floatPositionKey]);
        const storedFloatMode =
          (storage[floatModeKey] as boolean | undefined) === true;
        const storedPosition =
          (storage[floatPositionKey] as WidgetPosition | undefined) ?? null;

        setIsFloatMode(storedFloatMode);
        if (!storedFloatMode) {
          setPosition(null);
          setIsMinimized(false);
          return;
        }

        if (storedPosition) {
          setPosition(storedPosition);
        }
      })();
    };

    syncFloatState();
    window.addEventListener("focus", syncFloatState);
    document.addEventListener("visibilitychange", syncFloatState);

    return () => {
      window.removeEventListener("focus", syncFloatState);
      document.removeEventListener("visibilitychange", syncFloatState);
    };
  }, [embedded]);

  useEffect(() => {
    if (embedded || !isFloatMode || !position) {
      return;
    }
    const timer = window.setTimeout(() => {
      void saveToStorage({ [floatPositionKey]: position });
    }, 500);
    return () => {
      window.clearTimeout(timer);
    };
  }, [embedded, isFloatMode, position]);

  useEffect(() => {
    if (embedded || !isFloatMode) {
      return;
    }

    const widget = widgetRef.current;

    if (!widget) {
      return;
    }

    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;
    let dragging = false;

    const onPointerMove = (event: PointerEvent): void => {
      if (!dragging) {
        return;
      }

      const nextLeft = originLeft + (event.clientX - startX);
      const nextTop = originTop + (event.clientY - startY);

      const nextPosition = clampPosition(
        { left: nextLeft, top: nextTop },
        isMinimized ? minimizedButtonSize : widget.offsetWidth,
        isMinimized ? minimizedButtonSize : widget.offsetHeight
      );

      if (isMinimized) {
        minimizedButtonDraggedRef.current = true;
      }

      setPosition(nextPosition);
    };

    const onPointerUp = (): void => {
      dragging = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    const isInteractiveTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) {
        return false;
      }
      if (isMinimized && target.closest("#url-shortener-minimized-trigger")) {
        return false;
      }
      return Boolean(
        target.closest("input, button, a, textarea, select, label")
      );
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (event.button !== 0 || isInteractiveTarget(event.target)) {
        return;
      }

      event.preventDefault();
      minimizedButtonDraggedRef.current = false;
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;

      const rect = widget.getBoundingClientRect();
      originLeft = rect.left;
      originTop = rect.top;

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };

    widget.addEventListener("pointerdown", onPointerDown);

    return () => {
      widget.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [embedded, isFloatMode, isMinimized]);

  useEffect(() => {
    if (embedded || !isFloatMode || position) {
      return;
    }

    const widget = widgetRef.current;
    if (!widget) {
      return;
    }

    const rect = widget.getBoundingClientRect();

    setPosition(
      clampPosition(
        { left: rect.left, top: rect.top },
        isMinimized ? minimizedButtonSize : rect.width,
        isMinimized ? minimizedButtonSize : rect.height
      )
    );
  }, [embedded, isFloatMode, isMinimized, position]);

  useEffect(() => {
    if (embedded || !isFloatMode || !position) {
      return;
    }

    const syncPositionToViewport = (): void => {
      const widget = widgetRef.current;
      if (!widget) {
        return;
      }

      const width = isMinimized ? minimizedButtonSize : widget.offsetWidth;
      const height = isMinimized ? minimizedButtonSize : widget.offsetHeight;
      const nextPosition = clampPosition(position, width, height);

      if (
        nextPosition.left !== position.left ||
        nextPosition.top !== position.top
      ) {
        setPosition(nextPosition);
      }
    };

    syncPositionToViewport();
    window.addEventListener("resize", syncPositionToViewport);
    return () => {
      window.removeEventListener("resize", syncPositionToViewport);
    };
  }, [embedded, isFloatMode, isMinimized, position]);

  useEffect(() => {
    if (embedded || !isFloatMode || isMinimized) {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      return;
    }

    const widget = widgetRef.current;
    if (!widget) {
      return;
    }

    const idleMs = 6000;

    const scheduleMinimize = (): void => {
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = window.setTimeout(() => {
        minimizeWidget();
      }, idleMs);
    };

    const markActive = (): void => {
      if (isMinimized) {
        return;
      }
      scheduleMinimize();
    };

    scheduleMinimize();

    widget.addEventListener("pointerdown", markActive);
    widget.addEventListener("pointermove", markActive);
    widget.addEventListener("keydown", markActive);
    widget.addEventListener("focusin", markActive);
    widget.addEventListener("wheel", markActive);

    return () => {
      widget.removeEventListener("pointerdown", markActive);
      widget.removeEventListener("pointermove", markActive);
      widget.removeEventListener("keydown", markActive);
      widget.removeEventListener("focusin", markActive);
      widget.removeEventListener("wheel", markActive);
      if (idleTimerRef.current) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [embedded, isFloatMode, isMinimized]);

  useEffect(() => {
    if (embedded || !isFloatMode || isMinimized) {
      return;
    }

    const onOutsidePointerDown = (event: PointerEvent): void => {
      const widget = widgetRef.current;
      if (!widget) {
        return;
      }
      const rect = widget.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (inside) {
        return;
      }
      minimizeWidget();
    };

    document.addEventListener("pointerdown", onOutsidePointerDown, {
      capture: true,
    });
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointerDown, {
        capture: true,
      });
    };
  }, [embedded, isFloatMode, isMinimized]);

  const resetToFixedPosition = (): void => {
    setPosition(null);
  };

  const handleModeToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const enabled = event.target.checked;
    setIsFloatMode(enabled);
    setIsMinimized(false);
    if (!enabled) {
      resetToFixedPosition();
      void saveToStorage({ [floatModeKey]: false });
    } else {
      void saveToStorage({ [floatModeKey]: true });
    }
  };

  const handleRestore = (): void => {
    if (minimizedButtonDraggedRef.current) {
      minimizedButtonDraggedRef.current = false;
      return;
    }

    setIsMinimized(false);
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const fetchUrls = async (activeToken: string): Promise<void> => {
    setLoadingUrls(true);
    setMessage("");

    try {
      const query = new URLSearchParams({
        page: "1",
        limit: "30",
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(
        `${API_BASE}/url/user/all?${query.toString()}`,
        {
          method: "GET",
          headers: buildAuthHeaders(activeToken),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const body = (await response.json()) as { data?: { urls?: UrlItem[] } };
      setUrls(body?.data?.urls || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load URLs"
      );
    } finally {
      setLoadingUrls(false);
    }
  };

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setLoggingIn(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/user/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const body = (await response.json()) as {
        data?: { accessToken?: string; user?: AuthUser };
      };
      const data = body?.data || {};

      if (!data.accessToken) {
        throw new Error("Sign-in succeeded but access token is missing");
      }

      setToken(data.accessToken);
      setUser(data.user || null);
      setPassword("");
      setMessage("Signed in successfully");

      await saveToStorage({
        [tokenKey]: data.accessToken,
        [userKey]: data.user || null,
      });

      await fetchUrls(data.accessToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign-in failed");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setToken("");
    setUser(null);
    setUrls([]);
    setQrOpenFor("");
    setMessage("Logged out");
    await clearStorage([tokenKey, userKey]);
  };

  const handleCreateTempShortUrl = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    setCreatingTemp(true);
    setMessage("");
    setTempShortUrl("");

    try {
      const response = await fetch(
        `${TEMP_SHORTENER}${encodeURIComponent(tempUrl)}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Temporary short URL failed with status ${response.status}`
        );
      }

      const shortUrl = (await response.text()).trim();
      if (!shortUrl.startsWith("http")) {
        throw new Error(
          "Temporary short URL service returned an invalid response"
        );
      }

      setTempShortUrl(shortUrl);
      setMessage("Temporary short URL created");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create temporary short URL"
      );
    } finally {
      setCreatingTemp(false);
    }
  };

  const handleCreateShortUrl = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!token) {
      return;
    }

    setCreatingShort(true);
    setMessage("");

    try {
      const payload: { url: string; customShortId?: string } = {
        url: urlInput,
      };

      if (customShortId.trim()) {
        payload.customShortId = customShortId.trim();
      }

      const response = await fetch(`${API_BASE}/url`, {
        method: "POST",
        headers: buildAuthHeaders(token),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const body = (await response.json()) as {
        data?: { fullShortUrl?: string; shortId?: string };
      };
      const created = body?.data;

      setMessage(
        `Short URL ready: ${created?.fullShortUrl || created?.shortId || "created"}`
      );
      setCustomShortId("");
      await fetchUrls(token);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to create short URL"
      );
    } finally {
      setCreatingShort(false);
    }
  };

  const handleCopy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Copied to clipboard");
    } catch {
      setMessage("Could not copy to clipboard");
    }
  };

  if (embedded && storageLoaded && isFloatMode) {
    return (
      <div
        id="url-shortener-floating-widget"
        className="url-shortener-embedded"
      >
        <div id="url-shortener-drag-handle" ref={dragHandleRef}>
          <div className="url-shortener-header-row">
            <span>URL Shortener Widget</span>
          </div>
          <label
            className="url-shortener-mode-switch"
            title="Toggle floating mode"
          >
            <input
              type="checkbox"
              checked={isFloatMode}
              onChange={handleModeToggle}
            />
            <span>Float</span>
          </label>
        </div>
        <div
          id="url-shortener-body"
          className="url-shortener-float-active-body"
        >
          <p className="url-shortener-float-active-msg">
            Floating widget is active on the current page.
          </p>
          <p className="url-shortener-float-active-sub">
            Toggle Float off to use the widget here instead.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="url-shortener-floating-widget"
      className={[
        embedded ? "url-shortener-embedded" : "",
        !embedded && isFloatMode ? "url-shortener-float-on" : "",
        !embedded && !isFloatMode ? "url-shortener-float-off" : "",
        !embedded && storageLoaded && !isFloatMode
          ? "url-shortener-hidden"
          : "",
        isMinimized ? "url-shortener-minimized" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        !embedded && isFloatMode && position
          ? {
              left: `${position.left}px`,
              top: `${position.top}px`,
              right: "auto",
            }
          : undefined
      }
      ref={widgetRef}
    >
      {!embedded && isMinimized ? (
        <button
          id="url-shortener-minimized-trigger"
          type="button"
          onClick={handleRestore}
          aria-label="Open URL Shortener Widget"
        >
          🔗
        </button>
      ) : (
        <>
          <div id="url-shortener-drag-handle" ref={dragHandleRef}>
            <div className="url-shortener-header-row">
              <span>URL Shortener Widget</span>
            </div>
            <label
              className="url-shortener-mode-switch"
              title="Toggle floating mode"
            >
              <input
                type="checkbox"
                checked={isFloatMode}
                onChange={handleModeToggle}
              />
              <span>Float</span>
            </label>
          </div>

          <div id="url-shortener-body">
            {!token ? (
              <>
                <form className="url-shortener-form" onSubmit={handleLogin}>
                  <h4>Sign in</h4>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button type="submit" disabled={loggingIn}>
                    {loggingIn ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <form
                  className="url-shortener-form"
                  onSubmit={handleCreateTempShortUrl}
                >
                  <h4>Create Temporary Short URL</h4>
                  <input
                    type="url"
                    placeholder="Paste URL"
                    value={tempUrl}
                    onChange={(event) => setTempUrl(event.target.value)}
                    required
                  />
                  <button type="submit" disabled={creatingTemp}>
                    {creatingTemp ? "Creating..." : "Create Temporary URL"}
                  </button>
                  {tempShortUrl ? (
                    <div className="url-shortener-result-row">
                      <a href={tempShortUrl} target="_blank" rel="noreferrer">
                        {tempShortUrl}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(tempShortUrl)}
                      >
                        Copy
                      </button>
                    </div>
                  ) : null}
                </form>
              </>
            ) : (
              <>
                <div className="url-shortener-auth-row">
                  <span>{user?.name || user?.email || "User"}</span>
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>

                <form
                  className="url-shortener-form"
                  onSubmit={handleCreateShortUrl}
                >
                  <h4>Create Short URL</h4>
                  <input
                    type="url"
                    placeholder="Paste URL"
                    value={urlInput}
                    onChange={(event) => setUrlInput(event.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Custom short ID (optional)"
                    value={customShortId}
                    onChange={(event) => setCustomShortId(event.target.value)}
                  />
                  <button type="submit" disabled={creatingShort}>
                    {creatingShort ? "Creating..." : "Create Short URL"}
                  </button>
                </form>

                <section className="url-shortener-section">
                  <div className="url-shortener-section-title">Active URLs</div>
                  {loadingUrls ? <p>Loading...</p> : null}
                  {!loadingUrls && activeUrls.length === 0 ? (
                    <p>No active URLs</p>
                  ) : null}
                  {activeUrls.map((item) => (
                    <div
                      className="url-shortener-item"
                      key={item._id || item.shortId}
                    >
                      <a
                        href={`https://urltinier.app/${item.shortId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.shortId}
                      </a>
                      <div className="url-shortener-item-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(`https://urltinier.app/${item.shortId}`)
                          }
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQrOpenFor((prev) =>
                              prev === item.shortId ? "" : item.shortId
                            )
                          }
                        >
                          {qrOpenFor === item.shortId ? "Hide QR" : "Show QR"}
                        </button>
                      </div>
                      {qrOpenFor === item.shortId ? (
                        <img
                          className="url-shortener-qr"
                          src={createQrUrl(item.shortId)}
                          alt={`QR for ${item.shortId}`}
                        />
                      ) : null}
                    </div>
                  ))}
                </section>

                <section className="url-shortener-section">
                  <div className="url-shortener-section-title">History</div>
                  {urls.length === 0 ? <p>No history yet</p> : null}
                  {urls.map((item) => (
                    <div
                      className="url-shortener-history-row"
                      key={`history-${item._id || item.shortId}`}
                    >
                      <span>{item.shortId}</span>
                      <small>{shortDate(item.createdAt)}</small>
                    </div>
                  ))}
                </section>
              </>
            )}

            {message ? (
              <p className="url-shortener-message">{message}</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
