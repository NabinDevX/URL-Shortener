import toast, { Toaster as ReactHotToaster } from "react-hot-toast";

export interface ToastOptions {
  duration?: number;
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

/**
 * Toast notification system using react-hot-toast
 * Provides success, error, loading, and custom toasts
 */
export const Toast = {
  /**
   * Show success message
   */
  success: (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      duration: options?.duration ?? 4000,
      position: options?.position ?? "bottom-right",
    });
  },

  /**
   * Show error message
   */
  error: (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      duration: options?.duration ?? 5000,
      position: options?.position ?? "bottom-right",
    });
  },

  /**
   * Show warning message
   */
  warning: (message: string, options?: ToastOptions) => {
    return toast(
      () => (
        <div className="flex items-center gap-2 text-yellow-700">
          <span className="text-lg">⚠️</span>
          <span>{message}</span>
        </div>
      ),
      {
        duration: options?.duration ?? 4000,
        position: options?.position ?? "bottom-right",
      }
    );
  },

  /**
   * Show info message
   */
  info: (message: string, options?: ToastOptions) => {
    return toast(
      () => (
        <div className="flex items-center gap-2 text-blue-700">
          <span className="text-lg">ℹ️</span>
          <span>{message}</span>
        </div>
      ),
      {
        duration: options?.duration ?? 4000,
        position: options?.position ?? "bottom-right",
      }
    );
  },

  /**
   * Show loading toast (returns toast ID for later dismissal)
   */
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      position: options?.position ?? "bottom-right",
    });
  },

  /**
   * Update existing toast
   */
  update: (toastId: string, _options?: unknown) => {
    void _options;
    toast.remove(toastId);
  },

  /**
   * Dismiss specific toast or all toasts
   */
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  /**
   * Promise-based toast (auto-updates based on promise state)
   */
  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(
      promise,
      {
        loading,
        success: (data) =>
          typeof success === "function" ? success(data) : success,
        error: (err) => (typeof error === "function" ? error(err) : error),
      },
      {
        position: options?.position ?? "bottom-right",
      }
    );
  },

  /**
   * Custom toast
   */
  custom: (
    render: Parameters<typeof toast.custom>[0],
    options?: ToastOptions
  ) => {
    return toast.custom(render, {
      duration: options?.duration ?? 4000,
      position: options?.position ?? "bottom-right",
    });
  },
};

/**
 * Toaster component - place once in your app layout
 * Example: <Toaster />
 */
export const Toaster = () => (
  <ReactHotToaster
    position="bottom-right"
    reverseOrder={false}
    gutter={12}
    containerClassName=""
    containerStyle={{
      top: 40,
      left: 40,
      bottom: 40,
      right: 40,
    }}
    toastOptions={{
      duration: 4000,
      style: {
        background: "var(--surface)",
        color: "var(--text)",
        borderRadius: "8px",
        padding: "16px",
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        border: "1px solid var(--outline-variant)",
      },
      success: {
        duration: 4000,
        icon: "✅",
      },
      error: {
        duration: 5000,
        icon: "❌",
      },
      loading: {
        icon: "⏳",
      },
    }}
  />
);

export default Toast;
