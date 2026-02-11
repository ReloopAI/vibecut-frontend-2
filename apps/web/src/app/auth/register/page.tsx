"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";

export default function RegisterPage() {
	return (
		<Suspense fallback={null}>
			<RegisterContent />
		</Suspense>
	);
}

function RegisterContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextPath = searchParams.get("next") || "/projects";

	const register = useAuthStore((state) => state.register);
	const clearError = useAuthStore((state) => state.clearError);
	const error = useAuthStore((state) => state.error);
	const status = useAuthStore((state) => state.status);

	const [firstname, setFirstname] = useState("");
	const [lastname, setLastname] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [organisationName, setOrganisationName] = useState("");

	useEffect(() => {
		if (status === "authenticated") {
			router.replace(nextPath);
		}
	}, [nextPath, router, status]);

	const isSubmitting = status === "loading";

	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Create account</CardTitle>
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
								await register({
									email,
									firstname,
									lastname,
									password,
									organisationName: organisationName || undefined,
								});
							} catch {
								// Error state is already set in the auth store.
							}
						}}
					>
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="firstname">First name</Label>
								<Input
									id="firstname"
									value={firstname}
									onChange={(event) => setFirstname(event.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastname">Last name</Label>
								<Input
									id="lastname"
									value={lastname}
									onChange={(event) => setLastname(event.target.value)}
									required
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="new-password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required
								minLength={8}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="organisation_name">Organisation (optional)</Label>
							<Input
								id="organisation_name"
								value={organisationName}
								onChange={(event) => setOrganisationName(event.target.value)}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={isSubmitting}>
							{isSubmitting ? "Creating account..." : "Create account"}
						</Button>
					</form>
					<div className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link className="text-foreground underline" href="/auth/login">
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
