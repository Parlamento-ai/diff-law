/**
 * Shared pipeline types — used by CL, EU, US, and ES pipelines
 */

export type Status = 'PASS' | 'FAIL' | 'WARN';

export interface StepResult {
	step: number;
	id: string;
	name: string;
	status: Status;
	detail: string;
	elapsed: number;
}

export interface CrossCheck {
	name: string;
	status: Status;
	detail: string;
}

export interface PipelineManifest {
	country: string;
	slug: string;
	title: string;
	aknFiles: string[];
	elapsed: number;
	results: StepResult[];
	crossChecks?: CrossCheck[];
}
