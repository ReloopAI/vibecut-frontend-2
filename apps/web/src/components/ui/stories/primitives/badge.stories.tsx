import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../../badge";

const meta = {
	title: "UI/Badge",
	component: Badge,
	tags: ["autodocs"],
	args: {
		children: "Published",
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "secondary", "destructive", "outline"],
		},
	},
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = {
	args: {
		variant: "destructive",
		children: "Error",
	},
};

export const Outline: Story = {
	args: {
		variant: "outline",
		children: "Draft",
	},
};
