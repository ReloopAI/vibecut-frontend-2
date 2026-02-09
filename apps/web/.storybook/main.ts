import path from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	staticDirs: ["../public"],
	viteFinal: async (config) => {
		config.resolve = config.resolve ?? {};
		config.resolve.alias = {
			...(config.resolve.alias as Record<string, string> | undefined),
			"@": path.resolve(__dirname, "../src"),
		};
		return config;
	},
};

export default config;
