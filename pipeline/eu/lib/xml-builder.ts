/**
 * Shared XML builder for EU pipeline modules
 */

import { escapeXml } from '../../shared/xml.js';
export const esc = escapeXml;

export class XmlBuilder {
	private lines: string[] = [];
	private depth = 0;

	emit(line: string) {
		this.lines.push('  '.repeat(this.depth) + line);
	}
	open(tag: string, attrs: Record<string, string> = {}) {
		const a = Object.entries(attrs)
			.map(([k, v]) => ` ${k}="${esc(v)}"`)
			.join('');
		this.emit(`<${tag}${a}>`);
		this.depth++;
	}
	close(tag: string) {
		this.depth--;
		this.emit(`</${tag}>`);
	}
	selfClose(tag: string, attrs: Record<string, string> = {}) {
		const a = Object.entries(attrs)
			.map(([k, v]) => ` ${k}="${esc(v)}"`)
			.join('');
		this.emit(`<${tag}${a}/>`);
	}
	inline(tag: string, attrs: Record<string, string>, content: string) {
		const a = Object.entries(attrs)
			.map(([k, v]) => ` ${k}="${esc(v)}"`)
			.join('');
		this.emit(`<${tag}${a}>${content}</${tag}>`);
	}
	toString() {
		return this.lines.join('\n');
	}
}
