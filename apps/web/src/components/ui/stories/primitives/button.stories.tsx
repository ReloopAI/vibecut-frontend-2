import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "../../button";

const meta = {
	title: "UI/Button",
	component: Button,
	tags: ["autodocs"],
	args: {
		children: "Continue",
	},
	argTypes: {
		variant: {
			control: "select",
			options: [
				"default",
				"background",
				"foreground",
				"destructive",
				"destructive-foreground",
				"outline",
				"secondary",
				"text",
				"link",
			],
		},
		size: {
			control: "select",
			options: ["default", "sm", "lg", "icon", "text"],
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = {
	args: {
		variant: "destructive",
		children: "Delete project",
	},
};

export const SecondarySmall: Story = {
	args: {
		variant: "secondary",
		size: "sm",
		children: "Secondary action",
	},
};
