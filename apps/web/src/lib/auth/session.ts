let accessToken: string | null = null;

export const authSession = {
	getToken: () => accessToken,
	setToken: ({ token }: { token: string }) => {
		accessToken = token;
	},
	clear: () => {
		accessToken = null;
	},
};
