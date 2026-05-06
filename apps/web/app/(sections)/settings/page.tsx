"use client";

import { useState } from "react";
import axios, { AxiosError } from "axios";

export default function Settings() {
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState({ name: "", email: "" });
  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [theme, setTheme] = useState<"dark" | "system" | "light">("system");

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleAccountUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await axios.patch(
        "/user/update-account",
        { name: account.name, email: account.email, otp: "000000" },
        { withCredentials: true }
      );
      showMessage("Account update request submitted.");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      showMessage(
        axiosError.response?.data?.message || "Failed to update account."
      );
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmNewPassword) {
      showMessage("New password and confirm password must match.");
      return;
    }
    try {
      await axios.post(
        "/user/change-password",
        {
          oldPassword: password.oldPassword,
          newPassword: password.newPassword,
        },
        { withCredentials: true }
      );
      showMessage("Password updated successfully.");
      setPassword({ oldPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      showMessage(
        axiosError.response?.data?.message || "Failed to change password."
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete account permanently?")) return;
    try {
      await axios.delete("/user/delete-account", {
        params: { password: prompt("Enter password to confirm") || "" },
        withCredentials: true,
      });
      showMessage("Account deleted.");
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      showMessage(
        axiosError.response?.data?.message || "Failed to delete account."
      );
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-4 sm:space-y-12 sm:p-6 lg:p-8 intro-reveal">
      <section className="space-y-6 scroll-mt-28" id="account-settings">
        <div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight">
            Account Settings
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Update your profile details and password.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
            <h3 className="font-headline text-xl font-bold text-on-surface">
              Update Account
            </h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Change your display name and email address.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleAccountUpdate}>
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="accountName"
                >
                  Name
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="accountName"
                  value={account.name}
                  onChange={(e) =>
                    setAccount((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Your name"
                  type="text"
                />
              </div>
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="accountEmail"
                >
                  Email
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="accountEmail"
                  value={account.email}
                  onChange={(e) =>
                    setAccount((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                  type="email"
                />
              </div>
              <button
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-container transition-colors"
                type="submit"
              >
                Save Account Changes
              </button>
            </form>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm">
            <h3 className="font-headline text-xl font-bold text-on-surface">
              Change Password
            </h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Use a strong password with at least 6 characters.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handlePasswordUpdate}>
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="oldPassword"
                >
                  Current Password
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="oldPassword"
                  value={password.oldPassword}
                  onChange={(e) =>
                    setPassword((prev) => ({
                      ...prev,
                      oldPassword: e.target.value,
                    }))
                  }
                  type="password"
                />
              </div>
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="newPassword"
                >
                  New Password
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="newPassword"
                  value={password.newPassword}
                  onChange={(e) =>
                    setPassword((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  type="password"
                />
              </div>
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="confirmNewPassword"
                >
                  Confirm New Password
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="confirmNewPassword"
                  value={password.confirmNewPassword}
                  onChange={(e) =>
                    setPassword((prev) => ({
                      ...prev,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                  type="password"
                />
              </div>
              <button
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
                type="submit"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="space-y-6 pb-6" id="advanced">
        <div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight">
            Advanced
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Configure global application preferences.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-bold">Theme Mode</h3>
              <p className="text-sm text-on-surface-variant">
                System is the default. You can force Dark or Light mode.
              </p>
            </div>
            <div className="flex gap-2">
              {(["dark", "system", "light"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTheme(mode)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${theme === mode ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-5 border-t border-slate-100 pt-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-bold text-error">Delete Account</h3>
              <p className="text-sm text-on-surface-variant">
                Permanently remove all data and links. This cannot be undone.
              </p>
            </div>
            <button
              className="rounded-xl border-2 border-error bg-white px-6 py-2 text-sm font-bold text-error transition-all hover:bg-error hover:text-white"
              onClick={handleDeleteAccount}
              type="button"
            >
              Delete Account
            </button>
          </div>
        </div>
      </section>

      {message ? (
        <p className="text-xs rounded-lg bg-surface-container-high px-3 py-2 text-on-surface-variant">
          {message}
        </p>
      ) : null}
    </div>
  );
}
