"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_ROUTES = ["/login", "/reset-password"];

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isLoginRoute = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicRoute) {
      router.replace("/login");
    } else if (user && isLoginRoute) {
      router.replace("/");
    }
  }, [user, loading, isPublicRoute, isLoginRoute, router]);

  if (loading || (!user && !isPublicRoute) || (user && isLoginRoute)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <p className="font-mono text-xs" style={{ color: "var(--text-disabled)" }}>
          [ Cargando ]
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
