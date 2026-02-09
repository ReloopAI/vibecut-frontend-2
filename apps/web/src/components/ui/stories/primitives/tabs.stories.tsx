import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../tabs";

const meta = {
	title: "UI/Tabs",
	component: Tabs,
	tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Tabs defaultValue="project" className="w-[420px]">
			<TabsList>
				<TabsTrigger value="project">Project</TabsTrigger>
				<TabsTrigger value="assets">Assets</TabsTrigger>
				<TabsTrigger value="export">Export</TabsTrigger>
			</TabsList>
			<TabsContent value="project" className="text-sm">
				Project settings and metadata.
			</TabsContent>
			<TabsContent value="assets" className="text-sm">
				Uploaded media and linked files.
			</TabsContent>
			<TabsContent value="export" className="text-sm">
				Render quality and file output.
			</TabsContent>
		</Tabs>
	),
};
