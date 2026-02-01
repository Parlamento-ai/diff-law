import { docs } from '$lib/docs';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	return { docs };
};
