/**
 * @class WijitCode
 * @extends HTMLElement
 * @description A custom element for displaying code snippets with consistent formatting and entity encoding.
 * @author Holmes Bryant <webbmaastaa@gmail.com>
 * @license GPL-3.0
 *
 * @example
 * <wijit-code>
 *   <div>This is some code</div>
 * </wijit-code>
 */
export default class WijitCode extends HTMLElement {
	/**
	 * @constructor
	 * @description Creates a shadow root and sets up the initial structure.
	 */
	constructor() {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = `
			<style>
				code {
					tab-size: 2;
					width: max-content;
				}
			</style>
			<code part="code">
				<pre><slot></slot></pre>
			</code>
		`;
	}

	/**
	 * @function connectedCallback
	 * @description Called when the element is connected to the DOM.
	 * - Adjusts indentation to match surrounding text.
	 * - Encodes HTML entities within the code content.
	 */
	connectedCallback() {
		const html = this.innerHTML;
		const textBefore = this.previousSibling.textContent;
		const spaces = textBefore.match(/^\s*/)[0].length;
		const lines = html.match(/^.*$/gm);
		const regex = new RegExp(`^\\s{${spaces}}`, "gm");
		const result = lines.map (line => this.htmlEntities(line.replace(regex, ''))).join("\n").trim();
		this.innerHTML = result;
	}

	/**
	 * @function htmlEntities
	 * @description Encodes special characters in a string as HTML entities.
	 * @param 	{string} str The string to encode.
	 * @returns 	{string} 	 The encoded string.
	 */
	htmlEntities(str) {
		return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
	}
}

document.addEventListener('DOMContentLoaded', customElements.define('wijit-code', WijitCode));
