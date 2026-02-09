"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function AuthProvider({ children }: { children: ReactNode }) {
	const initialize = useAuthStore((state) => state.initialize);

	useEffect(() => {
		initialize();
	}, [initialize]);

	return <>{children}</>;
}
