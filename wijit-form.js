/**
 * @class WijitForm
 * @summary Represents a custom form component for handling form submissions, data fetching, and dialog display.
 * @remarks This class extends HTMLElement, allowing it to be used as a custom HTML element in web pages.
 * @author Holmes Bryant <webbmaastaa@gmail.com>
 * @license GPL-3.0
 */
export default class WijitForm extends HTMLElement {
	/**
	 * @private
	 * @type {string}
	 * @default "dialog-message"
	 * @summary The ID of the element to use for dialog messages.
	 */
	#dialogMessageId = "dialog-message";

	/**
	 * @private
	 * @type {object}
	 * @default {}
	 * @summary Options to be used for fetch requests.
	 */
	#fetchOptions = {};

	/**
	 * @private
	 * @type {boolean}
	 * @default false
	 * @summary Determines whether to force a server error during testing.
	 */
	#forceError = false;

	/**
	 * @private
	 * @type {boolean}
	 * @default false
	 * @summary Determines whether the dialog should be modal.
	 */
	#modal = false;

	/**
	 * @private
	 * @type {boolean}
	 * @default true
	 * @summary Determines whether to reset the form after submission.
	 */
	#reset = true;

	/**
	 * @private
	 * @type {string}
	 * @default "json"
	 * @summary The expected response format from the server ('json' or 'html').
	 */
	#response = 'json';

	/**
	 * @private
	 * @type {string | null}
	 * @summary The custom error message to display.
	 */
	#error;

	/**
	 * @private
	 * @type {string | null}
	 * @summary The custom success message to display.
	 */
	#success;

	/**
	 * @private
	 * @type {string | null}
	 * @summary The custom waiting message to display.
	 */
	#waiting;

	/**
	 * @type {NodeListOf<Element>}
	 * @summary A collection of elements to display error messages
	 */
	errorElems;

	/**
	 * @type {NodeListOf<Element>}
	 * @summary A collection of elements to display success messages
	 */
	successElems;

	/**
	 * @type {NodeListOf<Element>}
	 * @summary A collection of elements to display waiting messages
	 */
	waitingElems;

	/**
	 * @type {object}
	 * @summary Default messages for success, error, and waiting states.
	 */
	default = {
		success: "<h3>Submission Received</h3><p>Thank you!.</p>",
		error: "<h3>Oopsie!</h3><p>There was an error. Please get help.</p>",
		waiting: "<h1>Please Wait...</h1>"
	}

	/**
	 * @type {HTMLDialogElement}
	 * @summary The dialog element used to display messages.
	 */
	dialog;

	/**
	 * @type {boolean}
	 * @summary Determines whether the component is in testing mode.
	 */
	testing = false;

	/**
	 * @static
	 * @type {string[]}
	 * @summary A list of attributes that should be observed for changes.
	 */
	static observedAttributes = ['modal','fetch-options', 'response', 'reset', 'dialog-message-id', 'force-error'];

	constructor () {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					--error: darkred;
					--message-bg: ivory;
					--message-text: rgb(40,40,40);
					--success: limegreen;
				}

				::backdrop {
					background-color: white;
					opacity: .75;

				}

				@media (prefers-color-scheme: dark) {
					::backdrop
					{ background-color: black; }

					:host {
						--message-text: ivory;
						--message-bg: dimgray;
					}

				}

				button {
					padding: .5rem;
					border-radius: .5rem;
					cursor: pointer;
					font-weight: bold;
					margin-top: -1rem;
				}

				dialog {
					background-color: transparent;
					border: none;
					overflow: visible;
					text-align: center;
				}

				dialog.modeless {
					backdrop-filter: blur(.3rem);
					height: 100%;
					max-width: 100%;
					max-height: 100%;
					object-fit: scale-down;
					padding: 0;
					position: absolute;
					top: 50%;
					transform: translateY(-50%);
					width: 100%;
				}

				dialog form {
					margin: 1rem auto;
				}

				.hidden {
					opacity: 0;
					position: fixed;
					height: 0%;
					padding: 0;
				}

				#dialog-message {
					background-color: var(--message-bg);
					border-radius: 1rem;
					color: var(--message-text);
					margin: auto;
					padding: 1rem;
					position: relative;
					top: 50%;
					transform: translateY(-50%);
				}

				#dialog-message.waiting {
					aspect-ratio: 1/1;
					background-color: transparent;
					max-height: 100%;
					max-width: 100%;
					overflow: hidden;
					padding: 0;
					top: 0;
					transform: none;
					width: 100%;
				}

				#dialog-message.error {
					outline: 2px solid var(--error);
				}

				#dialog-message.success {
					outline: 2px solid var(--success);
				}


				#wrapper {
					position: relative;
				}
			</style>

			<div id="wrapper">
				<slot></slot>
				<slot name="dialog">
					<dialog class="modeless">
						<div id="dialog-message">
							<slot name="message"></slot>
						</div>
						<form method="dialog" class="hidden">
							<button>OK</button>
						</form>
					</dialog>
				</slot>
			</div>

			<div hidden id="responses" style="display:none">
				<button aria-label="close" form="dialog-form">OK</button>
				<slot name="waiting"></slot>
				<slot name="success"></slot>
				<slot name="error"></slot>
			</div>
		`;

		this.mainAbortController = new AbortController();
	}

	/**
	 * @summary Initializes the component when it is connected to the DOM.
	 * @description This method performs the following actions:
	 *  Retrieves references to key elements within the component's template, including:
	 *  The form element
	 *  dialog element
	 *  The message container element
	 *  Error, success, and waiting indicator elements
	 *  Attaches event listeners to:
	 *  The form's submit event, to handle data submission
	 *  The dialog's close event, to optionally reset the form
	 * @return {Void}
	 */
	connectedCallback () {
		this.form = this.querySelector('form');
		this.dialog = this.querySelector('dialog') || this.shadowRoot.querySelector('dialog');
		this.container = this.dialog.querySelector(`#${this.dialogMessageId}`);
		this.errorElems = this.querySelectorAll('[slot=error]');
		this.successElems = this.querySelectorAll('[slot=success]');
		this.waitingElems = this.querySelectorAll('[slot=waiting]');

		this.form.addEventListener('submit', (event) => this.submitData(event), {signal: this.mainAbortController.signal});
		this.dialog.addEventListener('close', (event) => {
			if (this.reset) this.resetForm(this.form);
		}, {signal: this.mainAbortController.signal});
	}

	/**
	 * @summary Responds to changes in observed attributes.
	 * @description This method performs the following actions:
	 *  Converts hyphenated attribute names to camelCase for internal property storage.
	 *  Updates the corresponding internal property with the new attribute value.
	 * @param {string} attr 	- The name of the attribute that has changed.
	 * @param {string} oldval 	- The previous value of the attribute.
	 * @param {string} newval 	- The new value of the attribute.
	 *
	 * @return {Void}
	 */
	attributeChangedCallback (attr, oldval, newval) {
		// if attribute name has hypons, camel-case it.
		if (attr.indexOf('-') > -1) {
			attr = attr.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
			attr = attr.replace(attr.charAt(0), attr.charAt(0).toLowerCase());
		}

		this[attr] = newval;
	}

	disconnectedCallback () {
		this.mainAbortController.abort();
	}

	/**
	 * @summary Handles form submission and data fetching.
	 * @description This method performs the following actions:
	 *   Prevents the default form submission behavior.
	 *   Extracts form data and target URL.
	 *   Sets fetch options, including the appropriate Accept header.
	 *   Displays a waiting dialog (if not in testing mode).
	 *   Constructs the request URL for GET/HEAD methods or sets the request body for other methods.
	 *   Fetches data from the server using fetchData.
	 *   Returns the result directly for testing purposes or displays a dialog with the result in regular mode.
	 * @param {Event} event - The submit event from the form.
	 * @returns {Promise<{data: any, status: number}>} - The result of the fetch operation (in testing mode).
	 * @see {@link fetchData}
	 */
	async submitData(event) {
		event.preventDefault();
		let url = event.target.action;
		const data = new FormData (event.target);
		const accept = (this.response === 'html') ? "text/html" : "application/json, application/xml";
		const options = this.setFetchOptions(event, accept);

		if (!this.testing) this.showDialog(this.waiting, null);

		if (options.method === 'GET' || options.method === 'HEAD') {
			let i = 0;
			url += '?';
			for (const entry of data.entries()) {
				url += (i === 0) ? entry.join('=') : `&${entry.join('=')}`;
				i++;
			}
			url = encodeURI(url);
		} else {
			options.body = data;
		}

		const result = await this.fetchData(url, options);
		if (this.testing) {
			return this.setMessage(result.data, result.status);
		} else {
			this.showDialog(result.data, result.status);
		}
	}

	/**
	 * @summary Send data to server and return result
	 * @param  	{string} url     	The url to the server
	 * @param  	{object} options 	Options object for Fetch
	 * @returns {object}			{data: string, status: number}
	 */
	async fetchData(url, options) {
		try {
			const response = await fetch (url, options);
			const status = response.status;
			const contentType = response.headers.get('Content-Type') || this.response;
			const data = contentType.includes('json') ? await response.json() : await response.text();
			return {data:data, status:status};
		} catch (error) {
			console.error (error);
		}
	}

	/**
	 * @summary Sets options for a fetch request.
	 * @description This method performs the following actions:
	 *  Creates a copy of the default fetch options.
	 *  Determines the HTTP method from the form's method attribute, defaulting to POST.
	 *  Sets the HTTP method in the options object.
	 *  Ensures the options object has a headers property.
	 *  Sets the Accept header based on the provided accept value, potentially overriding it with a value from the default options.
	 *  Returns the modified options object.
	 * @param {Event} event - The submit event from the form.
	 * @param {string} accept - The desired Accept header value.
	 * @returns {object} - The modified options object for the fetch request.
	 * @remarks This method is invoked to prepare options for the fetchData method.
	 * @see {@link fetchData}
	 */
	setFetchOptions(event, accept) {
		const options = JSON.parse (JSON.stringify (this.fetchOptions));
		const method = event.target.getAttribute('method') || 'POST';
		options.method = method.toUpperCase();
		options.headers = options.headers || {};
		// options.headers overrides 'accept' var
		options.headers.Accept = options.headers.Accept || accept;
		return options;
	}

	/**
	 * @summary Displays a dialog with a message and optional form.
	 * @description This method performs the following actions:
	 *  Constructs a message based on the provided data and status code.
	 *  Retrieves a form for closing the dialog.
	 *  Sets the message content within the dialog container.
	 *  Appends the close dialog form to the container (if a status code is present).
	 *  Shows the dialog in either modal or modeless mode.
	 *  Focuses on the close button (if a status code is present).
	 * @param 	{string} 			dataFromServer 	- Data received from the server.
	 * @param 	{number | null} 	statusCode 		- The HTTP status code of the response (optional).
	 * @returns {string | null} 				- The message that was set in the dialog.
	 * @remarks This method is invoked after data has been fetched from a server.
	 * @see {@link setMessage}
	 */
	showDialog(dataFromServer = '', statusCode) {
		const { container, dialog, modal } = this;
		const message = this.setMessage(dataFromServer, statusCode);
		const closeDialogForm = this.dialog.querySelector('form[method=dialog]');
		const btn = closeDialogForm.querySelector('input[type=submit], button');

		if (message) container.innerHTML = message;

		container.append(closeDialogForm);

		// If there is no status code, it means the dialog is showing the "Waiting" message and no "close" form/button should be show.
		if (statusCode) {
			closeDialogForm.classList.remove('hidden');
			btn.focus();
		} else {
			closeDialogForm.classList.add('hidden');
		}

		if (modal) {
			dialog.classList.remove('modeless');
			dialog.showModal();
		} else {
			dialog.classList.add('modeless');
			dialog.show();
		}

		return message;
	}

	/**
	 * @summary Constructs and sets a message based on data and status.
	 * @description This method performs the following actions:
	 *  Clears any existing message.
	 *  Determines the message type (waiting, error, or success) based on the status code.
	 *  Retrieves appropriate message elements or slots based on the type.
	 *  Constructs the message using one of the following approaches:
	 *   User-supplied custom message via attributes (with placeholder replacement for JSON data)
	 *   User-supplied custom message via slots (with content replacement for JSON data)
	 *   Default message (for waiting state or non-HTML responses)
	 *   Message sent from the server (for HTML responses with a status code)
	 *   Returns the constructed message.
	 * @param 	{string} 		dataFromServer 	- Data received from the server.
	 * @param 	{number | null} statusCode 		- The HTTP status code of the response (null for "waiting" message).
	 * @returns {string | null} 				- The constructed message.
	 * @remarks This method is invoked to prepare a message before displaying a dialog.
	 * @see {@link showDialog}
	 */
	setMessage(dataFromServer, statusCode) {
		const { waitingElems, errorElems, successElems, container } = this;
		this.clearMessage();
		let type, nodeList, message;

		if (statusCode === null) {
			type = 'waiting';
			nodeList = waitingElems;
			container.classList.add('waiting');
		} else if (statusCode > 399) {
			type = 'error';
			nodeList = errorElems;
			container.classList.add('error');
			container.classList.remove('waiting');
		} else {
			type = 'success';
			nodeList = successElems;
			container.classList.add('success');
			container.classList.remove('waiting');
		}

		if (this[type]) {
			// Handle user-supplied custom message via attributes
			message = this.response === 'json'
			? this.replacePlaceholders(this[type], dataFromServer)
			: this[type];
		} else if (nodeList.length > 0) {
			// Handle user-supplied custom message via slots
			if (this.response === 'json') {
				this.replaceNodeContents(nodeList, dataFromServer);
			}
			nodeList.forEach(node => node.setAttribute('slot', 'message'));
		} else if (this.response === 'html') {
			message = statusCode === null
			? this.default[type] // Waiting message
			: dataFromServer; // Server-sent message
		} else {
			message = this.default[type]; // Default message
		}

		return message;
	}

	/**
	 * @summary 	Replaces placeholders in a string with values from JSON data.
	 * @description This method performs the following actions:
	 *  Matches placeholders of the format {{property.path}} within the input string.
	 *  Extracts property paths from the matched placeholders.
	 *  Traverses the JSON data to retrieve values for the specified properties.
	 *  Replaces placeholders with the retrieved values (or stringifies objects if necessary).
	 *  Returns the modified string with placeholders replaced.
	 * @param 	{string} 	userdata - The input string containing placeholders.
	 * @param 	{any} 		jsondata - The JSON data to use for replacement.
	 * @returns {string}			 - The string with placeholders replaced.
	 * @remarks This method is used to create dynamic messages based on user input and server data.
	 */
	replacePlaceholders(userdata, jsondata) {
		const placeholderRegex = /{{([^{}]+)}}/g;
		let text = userdata;
		let match;

		while ((match = placeholderRegex.exec(text)) !== null) {
			const prop = match[1];
			const keys = prop.split('.');
			let result = jsondata;

			for (const key of keys) {
				result = result?.[key]; // Safe property access
				if (result === undefined) break; // Stop if property doesn't exist
			}

			text = text.replace(match[0], result === undefined ? match[0] : JSON.stringify(result));
		}

		return text;
	}

	/**
	 * Replace innerHTML contents of elements containing {{ }} placeholders with json data coming from server.
	 * @param  {NodeList} 	nodelist	Collection of nodes assigned to a named slot
	 * @param  {String} 	response	The response from the server
	 * @return {NodeList}				The collection with placeholders replaced with data
	 */
	replaceNodeContents(nodeList, response) {
		const placeholderRegex = /{{([^{}]+)}}/g;

		for (const node of nodeList) {
			let text = node.innerHTML;
			let match;

			while ((match = placeholderRegex.exec(text)) !== null) {
				const prop = match[1];
				const keys = prop.split('.');
				let result = response;

				for (const key of keys) {
					result = result?.[key];
					if (result === undefined) break;
				}

				text = text.replace(match[0], result === undefined ? match[0] : result);
			}

			node.innerHTML = text;
		}

		return nodeList;
	}

	/**
	 * Resets form inputs to default values
	 * @param  {HTMLElement} form The html form
	 * @returns {Void}
	 */
	resetForm(form) {
		// for some reason this.form.reset() is not a function ???
		const inputs = form.querySelectorAll('input, select, textarea');
		for (const input of inputs) {
			input.value = input.defaultValue || '';
		}
	}

	/**
	 * @summary Clears any existing message from the dialog.
	 * @description This method performs the following actions:
	 *  Removes error or success css classes from the message container.
	 *  Resets the slot attributes of waiting, error, and success message elements to their default states.
	 * @remarks This method is invoked to prepare the dialog for displaying a new message.
	 * @see {@link setMessage}
	 * @see {@link showDialog}
	 */
	clearMessage() {
		this.container.classList.remove('error');
		this.container.classList.remove('success');

		for (const w of this.waitingElems) w.setAttribute('slot', 'waiting');
		for (const e of this.errorElems) e.setAttribute('slot', 'error');
		for (const s of this.successElems) s.setAttribute('slot', 'success');
	}

	/**
	 * @summary Cleans HTML to allow only specific elements and attributes.
	 * @description This method performs the following actions:
	 *  Creates a temporary div element and sets its innerHTML to the provided HTML.
	 *  Iterates through the child nodes of the temporary element.
	 *  For each element node:
	 *   Checks if it's in the list of allowed elements (p, span, h1-h6, b, strong, i, hr, br).
	 *   If not, replaces the element with a text node containing its content.
	 *   Otherwise, removes any attributes not in the list of allowed attributes (id, class, style).
	 *   Returns the sanitized HTML content of the temporary element.
	 * @param {string} html - The HTML to be cleaned.
	 * @returns {string} - The cleaned HTML.
	 * @remarks This method is used to sanitize user-provided HTML to prevent potential security risks like cross-site scripting (XSS).
	 */
	cleanHTML(html) {
		const allowedElements = new Set(['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'strong', 'i', 'hr', 'br']);
		const allowedAttributes = new Set(['id', 'class', 'style']);
		const tempDiv = document.createElement('div');
		tempDiv.innerHTML = html;

		for (let i = tempDiv.childNodes.length - 1; i >= 0; i--) {
			const node = tempDiv.childNodes[i];
			if (node.nodeType === Node.ELEMENT_NODE) {

				// Check for allowed elements
				if (!allowedElements.has(node.localName.toLowerCase())) {
					// Replace with text node if not allowed
					tempDiv.replaceChild(document.createTextNode(node.textContent), node);
					continue;
				}

				// Filter allowed attributes
				const allowedAttrs = Array.from(node.attributes).filter(attr => allowedAttributes.has(attr.name));
				node.attributes.length = 0; // Clear existing attributes
				for (const attr of allowedAttrs) {
					node.setAttribute(attr.name, attr.value); // Set allowed attributes
				}
			}
		}

		return tempDiv.innerHTML;
	}

	/**
	 * @summary Validates whether a string is valid JSON.
	 * @description This method attempts to parse the input string as JSON using two strategies:
	 *  Direct parsing: It first tries to parse the string directly without any modifications.
	 *  Minimal adjustments: If direct parsing fails, it performs the following adjustments before attempting to parse again:
	 *   Removes potentially problematic characters (excluding essential quotes).
	 *   Encloses word-like sequences in double quotes to ensure proper parsing.
	 * @param {string} string - The string to be validated.
	 * @returns {boolean|any} - Returns true if the string is valid JSON, false if invalid, or the parsed JSON object if successful.
	 * @remarks This method prioritizes direct parsing for efficiency and only applies minimal adjustments if necessary.
	 */
	validateJson(string) {
		try {
			// Attempt parsing directly, avoiding unnecessary regex replacement
			return JSON.parse(string);
		} catch (error) {
			// If parsing fails, attempt minimal adjustments and try again
			try {
				// Remove problematic characters while preserving essential quotes
				const adjustedString = string
				.replace(/['"<>;\s\t\n\r?()]/g, '')
				.replace(/([\w:\/\\]+)/g, '"$&"');

				return JSON.parse(adjustedString);
			} catch (error) {
				// If still unsuccessful, return false
				return false;
			}
		}
	}

	get modal () { return this.#modal; }
	set modal (value) {
		switch (value) {
		case '':
		case 'true':
			value = true;
			break;
		default:
			value = false;
		}

		this.#modal = value;
	}

	get fetchOptions () { return this.#fetchOptions; }
	set fetchOptions (value) {
		let result;
		value = this.validateJson(value);
		if (typeof value === 'object') {
			this.#fetchOptions = value;
		}
	}

	get response () { return this.#response; }
	set response (value) {
		this.#response = value.toLowerCase();
	}

	get reset () { return this.#reset; }
	set reset (value) {
		switch (value) {
		case '':
		case 'true':
			value = true;
			break;
		default:
			value = false;
		}

		this.#reset = value;
	}

	get waiting () { return this.#waiting; }
	set waiting (value) {
		value = this.cleanHTML(value);
		this.#waiting = value;
	}

	get success () { return this.#success; }
	set success (value) {
		value = this.cleanHTML(value);
		this.#success = value;
	}

	get error () { return this.#error; }
	set error (value) {
		value = this.cleanHTML(value);
		this.#error = value;
	}

	get dialogMessageId () { return this.#dialogMessageId }
	set dialogMessageId (value) {
		this.#dialogMessageId = value;
	}

	get forceError() { return this.#forceError; }

	/**
	 * @summary Adds to the form a hidden input having a name of "fail"
	 * @description If you use this, make sure the server script handles it and returns a status code greater than 399.
	 * @param  {string} value Empty string or "true" for true, any other string for false
	 * @returns {Void}
	 */
	set forceError(value) {
		let input = this.form.querySelector('input[name=fail]');

		switch (value) {
		case '':
		case 'true':
			value = true;
			if (!input) {
				input = document.createElement('input');
				input.name = 'fail';
				input.value = 'true';
				input.type = 'hidden';
				this.form.append(input);
			}
			break;
		default:
			value = false;
			if (input) input.remove();
		}

		this.#forceError = value;
	}
}


document.addEventListener('DOMContentLoaded', customElements.define('wijit-form', WijitForm));


