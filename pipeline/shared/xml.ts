/**
 * Shared XML utilities — escapeXml, buildArticlesXml, today
 * Used by CL, EU, US, and ES pipelines
 */

export function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/** Build XML for a list of articles in <body> */
export function buildArticlesXml(
	articles: Array<{ eId: string; heading: string; content: string }>
): string {
	return articles
		.map(
			({ eId, heading, content }) => `      <article eId="${eId}">
        <heading>${escapeXml(heading)}</heading>
        <content>
          <p>${escapeXml(content)}</p>
        </content>
      </article>`
		)
		.join('\n');
}

/** Today's date in YYYY-MM-DD format */
export function today(): string {
	return new Date().toISOString().slice(0, 10);
}
