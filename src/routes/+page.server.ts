export const actions = {
	save: async ({ request }) => {
		const data = await request.formData();
		console.log(data.get('url'));
	}
};
