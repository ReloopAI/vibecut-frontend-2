import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
	parameters: {
		layout: "centered",
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		backgrounds: {
			default: "app",
			values: [
				{ name: "app", value: "hsl(0 0% 100%)" },
				{ name: "dark", value: "hsl(0 0% 4%)" },
			],
		},
	},
	decorators: [
		(Story) => (
			<div className="bg-background text-foreground min-h-[240px] w-[640px] p-6">
				<Story />
			</div>
		),
	],
};

export default preview;
