import type { Meta, StoryObj } from "@storybook/react";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../../card";
import { Button } from "../../button";

const meta = {
	title: "UI/Card",
	component: Card,
	tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Card className="w-[420px]">
			<CardHeader>
				<CardTitle>Weekly Draft Review</CardTitle>
				<CardDescription>
					Review timeline changes before publishing.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">
					3 clips updated, 1 caption changed, and background audio normalized.
				</p>
			</CardContent>
			<CardFooter className="justify-end">
				<Button size="sm">Open project</Button>
			</CardFooter>
		</Card>
	),
};
