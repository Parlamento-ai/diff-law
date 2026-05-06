import { billEntries } from '../loader';

export const prerender = true;

export function entries() {
	return billEntries();
}
