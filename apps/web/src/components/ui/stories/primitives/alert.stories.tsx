import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertDescription, AlertTitle } from "../../alert";

const meta = {
	title: "UI/Alert",
	component: Alert,
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "destructive"],
		},
	},
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => (
		<Alert {...args} className="w-[520px]">
			<AlertTitle>Heads up</AlertTitle>
			<AlertDescription>
				Local autosave is enabled. Your project data is stored in this browser.
			</AlertDescription>
		</Alert>
	),
};

export const Destructive: Story = {
	args: {
		variant: "destructive",
	},
	render: (args) => (
		<Alert {...args} className="w-[520px]">
			<AlertTitle>Cloud sync failed</AlertTitle>
			<AlertDescription>
				Upload could not complete. Check network and retry.
			</AlertDescription>
		</Alert>
	),
};
