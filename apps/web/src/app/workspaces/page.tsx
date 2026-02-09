"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { backendAuthApi, type TWorkspace } from "@/lib/auth/api-client";
import { authSession } from "@/lib/auth/session";

function WorkspacesContent() {
	const [workspaces, setWorkspaces] = useState<TWorkspace[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const token = authSession.getToken();
		if (!token) {
			setError("Missing session token");
			setIsLoading(false);
			return;
		}

		backendAuthApi
			.getWorkspaces({ token })
			.then((data) => {
				setWorkspaces(data);
			})
			.catch((requestError) => {
				setError(
					requestError instanceof Error
						? requestError.message
						: "Failed to load workspaces",
				);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	if (isLoading) {
		return <div className="text-muted-foreground">Loading workspaces...</div>;
	}

	if (error) {
		return <div className="text-destructive">{error}</div>;
	}

	return (
		<div className="space-y-3">
			{workspaces.length === 0 ? (
				<div className="text-muted-foreground">No workspaces available.</div>
			) : (
				workspaces.map((workspace) => (
					<Card key={workspace.id}>
						<CardHeader>
							<CardTitle className="text-base">{workspace.name}</CardTitle>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							<div>ID: {workspace.id}</div>
							<div>Organisation: {workspace.organisation_id}</div>
						</CardContent>
					</Card>
				))
			)}
		</div>
	);
}

export default function WorkspacesPage() {
	return (
		<div className="min-h-screen bg-background p-6 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold">Workspaces</h1>
				<Link href="/projects">
					<Button variant="outline">Back to projects</Button>
				</Link>
			</div>
			<WorkspacesContent />
		</div>
	);
}
