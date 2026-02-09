import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Label } from "../../label";
import { Switch } from "../../switch";

const meta = {
	title: "UI/Switch",
	component: Switch,
	tags: ["autodocs"],
	args: {
		defaultChecked: false,
	},
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Controlled: Story = {
	render: () => {
		const [enabled, setEnabled] = useState(true);
		return (
			<div className="flex items-center gap-3">
				<Switch checked={enabled} onCheckedChange={setEnabled} id="snap" />
				<Label htmlFor="snap">
					Snap to timeline ({enabled ? "on" : "off"})
				</Label>
			</div>
		);
	},
};
