import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input } from "../../input";

const meta = {
	title: "UI/Input",
	component: Input,
	tags: ["autodocs"],
	args: {
		placeholder: "Project name",
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithClearAction: Story = {
	render: () => {
		const [value, setValue] = useState("My video edit");
		return (
			<Input
				value={value}
				onChange={(event) => setValue(event.target.value)}
				showClearIcon
				onClear={() => setValue("")}
			/>
		);
	},
};

export const Password: Story = {
	render: () => {
		const [showPassword, setShowPassword] = useState(false);
		return (
			<Input
				type="password"
				value="secret-token"
				readOnly
				showPassword={showPassword}
				onShowPasswordChange={setShowPassword}
			/>
		);
	},
};
