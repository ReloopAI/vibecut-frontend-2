import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../../checkbox";
import { Label } from "../../label";

const meta = {
	title: "UI/Checkbox",
	component: Checkbox,
	tags: ["autodocs"],
	args: {
		defaultChecked: false,
	},
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const CheckedWithLabel: Story = {
	render: () => (
		<div className="flex items-center gap-2">
			<Checkbox id="autosave" defaultChecked />
			<Label htmlFor="autosave">Enable autosave</Label>
		</div>
	),
};
