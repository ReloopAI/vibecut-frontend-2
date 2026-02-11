"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginContent />
		</Suspense>
	);
}

function LoginContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextPath = searchParams.get("next") || "/projects";

	const login = useAuthStore((state) => state.login);
	const clearError = useAuthStore((state) => state.clearError);
	const error = useAuthStore((state) => state.error);
	const status = useAuthStore((state) => state.status);
	const isInitialized = useAuthStore((state) => state.isInitialized);

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
		if (status === "authenticated") {
			router.replace(nextPath);
		}
	}, [nextPath, router, status]);

	const isSubmitting = status === "loading";

	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Sign in</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{error ? (
						<div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
							{error}
						</div>
					) : null}
					<form
						className="space-y-4"
						onSubmit={async (event) => {
							event.preventDefault();
							clearError();
							try {
								await login({ username, password });
							} catch {
								// Error state is already set in the auth store.
							}
						}}
					>
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								autoComplete="username"
								value={username}
								onChange={(event) => setUsername(event.target.value)}
								placeholder="john"
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="********"
								required
							/>
						</div>
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? "Signing in..." : "Sign in"}
						</Button>
					</form>
					<div className="text-sm text-muted-foreground">
						No account yet?{" "}
						<Link className="text-foreground underline" href="/auth/register">
							Create one
						</Link>
					</div>
					{!isInitialized ? (
						<div className="text-xs text-muted-foreground">Loading session...</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
