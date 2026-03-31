"use client";

import dynamic from "next/dynamic";

const RouterApp = dynamic(() => import("./RouterApp"), { ssr: false });

export default function RootPage() {
  return <RouterApp />;
}
