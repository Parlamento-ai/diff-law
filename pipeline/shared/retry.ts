/**
 * Retry utilities with exponential backoff
 * Shared across CL/US/ES pipelines
 */

export interface RetryOptions {
	/** Max number of attempts (default: 3) */
	maxAttempts?: number;
	/** Initial delay in ms (default: 1000) */
	initialDelay?: number;
	/** Backoff multiplier (default: 2) */
	multiplier?: number;
	/** Optional label for log messages */
	label?: string;
}

/**
 * Retry an async function with exponential backoff.
 * Logs each retry attempt. Throws the last error if all attempts fail.
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options?: RetryOptions
): Promise<T> {
	const maxAttempts = options?.maxAttempts ?? 3;
	const initialDelay = options?.initialDelay ?? 1000;
	const multiplier = options?.multiplier ?? 2;
	const label = options?.label ?? 'operation';

	let lastError: Error | undefined;
	let delay = initialDelay;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await fn();
		} catch (err) {
			lastError = err instanceof Error ? err : new Error(String(err));
			if (attempt < maxAttempts) {
				console.warn(
					`  Retry ${attempt}/${maxAttempts} for ${label}: ${lastError.message} (waiting ${delay}ms)`
				);
				await sleep(delay);
				delay = Math.round(delay * multiplier);
			}
		}
	}

	throw lastError!;
}

/**
 * fetch() wrapper with retry and exponential backoff.
 * Retries on network errors and 5xx status codes.
 */
export async function fetchWithRetry(
	url: string,
	options?: RequestInit & RetryOptions
): Promise<Response> {
	const { maxAttempts, initialDelay, multiplier, label, ...fetchOptions } = options ?? {};

	return withRetry(
		async () => {
			const resp = await fetch(url, fetchOptions);
			if (resp.status >= 500) {
				throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
			}
			return resp;
		},
		{ maxAttempts, initialDelay, multiplier, label: label ?? url.split('?')[0] }
	);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
