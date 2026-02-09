"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

const PUBLIC_PATH_PREFIXES = ["/auth", "/privacy", "/terms"];

export function AuthGuard({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const status = useAuthStore((state) => state.status);
	const isInitialized = useAuthStore((state) => state.isInitialized);
	const isPublicPath = PUBLIC_PATH_PREFIXES.some((prefix) =>
		(pathname ?? "").startsWith(prefix),
	);

	useEffect(() => {
		if (isPublicPath) {
			return;
		}
		if (!isInitialized) {
			return;
		}
		if (status === "authenticated") {
			return;
		}

		const redirectPath = pathname ?? "/projects";
		router.replace(`/auth/login?next=${encodeURIComponent(redirectPath)}`);
	}, [isInitialized, isPublicPath, pathname, router, status]);

	if (isPublicPath) {
		return <>{children}</>;
	}

	if (!isInitialized || status === "loading") {
		return (
			<div className="min-h-screen flex items-center justify-center text-muted-foreground">
				Checking session...
			</div>
		);
	}

	if (status !== "authenticated") {
		return null;
	}

	return <>{children}</>;
}
