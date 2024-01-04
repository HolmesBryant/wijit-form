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
	 * @type {boolean}
	 * @default false
	 * @summary Whether to add default css. "true" means do not add default css and let user style to form with their own css.
	 */
	#customCss = false;

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
		success: "<h3>Submission Received</h3><p>Thank you!</p>",
		error: "<h3>Oopsie!</h3><p>There was an error. Your submission was not received.</p>",
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
	static observedAttributes = ['modal','fetch-options', 'response', 'reset', 'dialog-message-id', 'force-error', 'custom-css'];

	constructor () {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = `
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
		if (!this.customCss) document.head.append(this.defaultCss());

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

	/**
	 * @summary Returns a Style element containing css rules.
	 * @returns {HTMLStyleElement}
	 */
	defaultCss() {
		const style = `
			<style>
				html, body * { box-sizing: border-box; }

				@layer wijit-form {
					wijit-form {
					    --bg1: rgb(250,250,250);
					    --bg2: rgb(245,245,245);
					    --bg3: white;
					    --text: rgb(60,60,60);
					    --border: silver;
					    --fail: hsl(6, 93%, 80%);
					    --pass: hsl(112, 70%, 75%);
					    --accent: lime;
					    --min: 2.5rem;
					    --pad: .25rem;

					    @media (prefers-color-scheme: dark) {
					        --text: rgb(240,240,240);
					        --bg1: rgb(35,35,35);
					        --bg2: rgb(40,40,40);
					        --bg3: rgb(60,60,60);
					        --border: dimgray;
					    }


					    background-color: var(--bg1);
					    border-radius: 10px;
					    display: inline-block;
					    padding: 1rem;
					    width: 100%;
					}

				    /*********************/
				    /**** Backgrounds ****/
				    /*********************/

					    details > *,
					    fieldset,
					    section
					    { background-color: var(--bg2); }

					    button,
					    hr,
					    input,
					    progress,
					    select,
					    textarea
					    { background-color: var(--bg3); }

					    .primary,
					    progress::-webkit-progress-value
					    { background-color: var(--accent); }

						progress::-moz-progress-bar
						{ background-color: var(--accent); }

					    .error
					    { background-color: var(--fail); }

					    .success
					    { background-color: var(--pass); }

				    /********************************/
				    /****** Borders / Outlines ******/
				    /********************************/

					    button,
					    fieldset,
					    input,
					    input[type="checkbox"]::before,
					    input[type="radio"]::before,
					    progress,
					    select,
					    textarea,
					    .error,
					    .success
					    { border: 1px solid var(--border); }

					    hr
					    { border: none; }

					    input:user-valid:not([type="submit"]):not([type="reset"])
					    { border-color: var(--pass) }

					    :user-invalid
					    { border-color: var(--fail) }

					    :user-valid
					    { border-color: var(--pass) }

					    button,
					    fieldset,
					    hr,
					    input,
					    input[type="checkbox"]::before,
					    option,
					    progress,
					    progress::-webkit-progress-value,
					    progress::-webkit-progress-bar,
					    section,
					    select,
					    textarea,
					    .error,
					    .success
					    { border-radius: .5rem; }

					    :focus-visible
					    {
					    	border-color: transparent;
					    	outline: 1px solid var(--accent);
					    }

				    /******************************/
				    /*********** Accent ***********/
				    /******************************/
					    input
					    { accent-color: var(--accent); }

				    /******************************/
				    /************ Text ************/
				    /******************************/

					    label.required:after
					    { color: var(--fail) }

					    button,
					    input,
					    fieldset,
					    label,
					    legend,
					    select,
					    textarea
					    {
					        color: var(--text);
					        font-size: 1rem;
					    }

					    .primary
					    { color: var(--bg3) }

					     option
					    { font-size: 1.2rem; }

					    input[type="checkbox"]::before,
					    input[type="radio"]::before
					    {
					    	font-size: 2.5rem;
					    	 line-height: 2.4rem;
					    }

					    label.required
					    { font-size: small }

					    button,
					    .button,
					    input[type="reset"],
					    input[type="submit"],
					    label,
					    legend,
					    .error,
					    .success
					    { font-weight:bold; }

					    .primary
					    { text-shadow: 1px 1px 1px var(--text) }

					    .error,
					    .success
					    { text-align: center; }

				    /*********************/
				    /****** Shadows ******/
				    /*********************/

					    button:hover,
					    input[type="submit"]:hover,
					    input[type="reset"]:hover
					    { box-shadow: 2px 2px 5px black; }

					    button:active,
					    input[type="submit"]:active,
					    input[type="reset"]:active
					    { box-shadow: none; }

				    /*********************/
				    /******* Cursor ******/
				    /*********************/

					    input[type="checkbox"],
					    input[type="radio"],
					    input[type="color"],
					    input[type="range"],
					    input[type="reset"],
					    input[type="submit"],
					    label,
					    button,
					    select
					    { cursor: pointer; }

					    [disabled]
					    { cursor: not-allowed; }

				    /*********************/
				    /***** Structure *****/
				    /*********************/

					    div,
						fieldset,
						section {
							display: flex;
							flex-direction: column;
							flex-wrap: wrap;
							gap: 0.5rem;
						}

						div {
							align-items: stretch;
						}

						div.row {
							align-items: center;
						}

						div > *,
						fieldset > *,
						section > * {
							flex: 1;
						}

						button,
						input,
						select,
						textarea {
					    	min-height: var(--min);
					    	min-width: var(--min);
					        padding: var(--pad);
					    }

					    hr {
							min-width: 100%;
							max-height: 5px;
						}

						.row > hr {
							min-width: 5px;
							margin: 0;
							max-width: 5px;
							max-height: 100%;
						}

					    input[type="color"],
					    input[type="checkbox"],
					    input[type="radio"] {
					    	flex: 0;
					    	flex-basis: var(--min);
					    	padding: 0;
					    	width: var(--min);
					    }

						label {
							flex: 0;
							white-space: nowrap;
						}

						progress {
							-webkit-appearance: none;
							-moz-appearance: none;
							appearance: none;
							inline-size: 100%;
							min-height: 1rem;
						}

						progress::-webkit-progress-value {
							min-height: 1rem;
						}

						section + section {
							margin: 1rem 0;
						}

						select
					    {
					    	min-width: 10rem;
					        padding: var(--pad);
					    	overflow: auto;
					    	width: max-content;
					    }

					    textarea
					    {
					    	flex: 1;
					    	min-height: 5rem;
					    	min-width: 10rem;
					    	padding: var(--pad);
					    }

						.reverse {
							flex-direction: column-reverse;
						}

						.row {
							flex-direction: row;
						}

						.row.reverse {
							flex-direction: row-reverse;
						}

						.start {
							align-content: flex-start;
						}

						.start > * {
							flex: 0;
						}

						.end {
							align-content: flex-end;
							justify-content: flex-end;
						}

						.end > * {
							flex: 0;
						}

						.center {
							justify-content: center;
							align-content: center;
						}

						.center > * {
							flex: 0;
						}
				} /* @layer */
            </style>
		`;

		return document.createRange().createContextualFragment(style);
	}

	/**
	 * @returns {boolean}
	 */
	get customCss () { return this.#customCss }

	set customCss (value) {
		switch (value) {
		case '':
		case 'true':
			value = true;
			this.shadowRoot.prepend(this.defaultCss());
			break;
		default:
			value = false;
			const style = this.shadowRoot.querySelector('style');
			if (style) style.remove();
		}

		this.#customCss = value;
	}

	/**
	 * @returns {string}
	 */
	get dialogMessageId () { return this.#dialogMessageId }

	set dialogMessageId (value) {
		this.#dialogMessageId = value;
	}

	/**
	 * @returns {object}
	 */
	get fetchOptions () { return this.#fetchOptions; }
	set fetchOptions (value) {
		let result;
		value = this.validateJson(value);
		if (typeof value === 'object') {
			this.#fetchOptions = value;
		}
	}

	/**
	 * @returns {boolean}
	 */
	get forceError() { return this.#forceError; }

	/**
	 * @summary Adds to the form a hidden input having a name of "fail"
	 * @description If you use this, make sure the server script handles it and returns an http status code greater than 399.
	 * @param  {string} value Empty string or "true" for true, any other string for false
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

	/**
	 * @returns {boolean}
	 */
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

	/**
	 * @returns {boolean}
	 */
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

	/**
	 * @returns {string}
	 */
	get response () { return this.#response; }
	set response (value) {
		this.#response = value.toLowerCase();
	}

	/**
	 * @returns {string}
	 */
	get error () { return this.#error; }
	set error (value) {
		value = this.cleanHTML(value);
		this.#error = value;
	}

	/**
	 * @returns {string}
	 */
	get success () { return this.#success; }
	set success (value) {
		value = this.cleanHTML(value);
		this.#success = value;
	}

	/**
	 * @returns {string}
	 */
	get waiting () { return this.#waiting; }
	set waiting (value) {
		value = this.cleanHTML(value);
		this.#waiting = value;
	}
}


document.addEventListener('DOMContentLoaded', customElements.define('wijit-form', WijitForm));


