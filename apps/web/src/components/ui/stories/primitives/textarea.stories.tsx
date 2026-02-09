import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "../../textarea";

const meta = {
	title: "UI/Textarea",
	component: Textarea,
	tags: ["autodocs"],
	args: {
		placeholder: "Describe your edit...",
		rows: 4,
	},
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
	args: {
		defaultValue: "Add intro clip, trim outro, and normalize audio.",
	},
};
