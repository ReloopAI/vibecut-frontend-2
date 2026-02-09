import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "../../progress";

const meta = {
	title: "UI/Progress",
	component: Progress,
	tags: ["autodocs"],
	args: {
		value: 42,
	},
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Complete: Story = {
	args: {
		value: 100,
	},
};

export const StackedExample: Story = {
	render: () => (
		<div className="w-full space-y-3">
			<Progress value={15} />
			<Progress value={48} />
			<Progress value={83} />
		</div>
	),
};
