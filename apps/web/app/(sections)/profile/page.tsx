"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@repo/ui";

export default function Profile() {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    createdAt: "",
  });
  const [loading, setLoading] = useState(true);
  const [fetchDone, setFetchDone] = useState(false);
  const { userData: authUserData } = useAuth();
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (fetchDone) return;
    if (authUserData) {
      setFetchDone(true);
      setUserData({
        name: authUserData.name,
        email: authUserData.email,
        createdAt: authUserData.createdAt || "",
      });
      setLoading(false);
    }
  }, [authUserData, fetchDone]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4" />
          <p className="text-on-surface-variant text-lg font-semibold">
            Loading Profile...
          </p>
        </div>
      </div>
    );
  }

  const fallbackAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(userData.name)}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8 intro-reveal">
      <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm text-center">
        <div className="relative inline-flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-surface-container-low mb-4 ring-4 ring-primary/20">
          <Image
            alt={userData.name}
            className="object-cover"
            fill
            onError={(event) => {
              event.currentTarget.src = fallbackAvatar;
            }}
            sizes="96px"
            src={fallbackAvatar}
            unoptimized
          />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">
          {userData.name}
        </h1>
        <p className="text-on-surface-variant mt-1">{userData.email}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover-float">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-primary">
              person
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Name
            </p>
          </div>
          <p className="text-lg font-bold text-on-surface">{userData.name}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover-float">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-primary">
              email
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Email
            </p>
          </div>
          <p className="text-lg font-bold text-on-surface">{userData.email}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm hover-float">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-primary">
              calendar_today
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Member Since
            </p>
          </div>
          <p className="text-lg font-bold text-on-surface">
            {userData.createdAt
              ? new Date(userData.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>
      </section>

      <section className="flex flex-wrap justify-center gap-4">
        <Link href="/dashboard" className="btn btn-primary">
          <span className="material-symbols-outlined text-base">dashboard</span>
          Back to Dashboard
        </Link>
        <Link href="/settings" className="btn btn-secondary">
          <span className="material-symbols-outlined text-base">settings</span>
          Profile Settings
        </Link>
        <button
          type="button"
          onClick={async () => {
            try {
              await logout();
            } catch {
              // ignore
            }
            void router.replace("/signin/");
          }}
          className="btn btn-danger"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign Out
        </button>
      </section>
    </div>
  );
}
