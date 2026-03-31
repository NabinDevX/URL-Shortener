"use client";

import { BrowserRouter } from "react-router-dom";
import type { ReactNode } from "react";

export default function BrowserRouterProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <BrowserRouter>{children}</BrowserRouter>;
}
