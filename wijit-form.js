export default class WijitForm extends HTMLElement {
	#dialogMessageId = "dialog-message";
	#fetchOptions = {};
	#forceError = false;
	#modal = false;
	#reset = true;
	#response = 'json';
	#error;
	#success;
	#waiting;
	errorElems;
	successElems;
	waitingElems;
	default = {
		success: "<h3>Submission Received</h3><p>Thank you!.</p>",
		error: "<h3>Oopsie!</h3><p>There was an error. Please get help.</p>",
		waiting: "<h1>Please Wait...</h1>"
	}
	dialog;
	testing = false;
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

	connectedCallback () {
		this.fetchOptions = this.getAttribute('fetch-options') || {};
		this.response = this.getAttribute('response') || this.response;
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

	attributeChangedCallback (attr, oldval, newval) {
		// if attribute name has hypons, camel-case it.
		if (attr.indexOf('-') > -1) {
			attr = attr.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
			attr = attr.replace(attr.charAt(0), attr.charAt(0).toLowerCase());
		}

		// console.log(attr, newval);
		this[attr] = newval;
	}

	disconnectedCallback () {
		this.mainAbortController.abort();
	}

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

	setFetchOptions(event, accept) {
		const options = JSON.parse (JSON.stringify (this.fetchOptions));
		const method = event.target.getAttribute('method') || 'POST';
		options.method = method.toUpperCase();
		options.headers = options.headers || {};
		// options.headers overrides 'accept' var
		options.headers.Accept = options.headers.Accept || accept;
		return options;
	}

	test (dataFromServer, statusCode) {
		return this.setMessage (dataFromServer, statusCode);
	}

	showDialog(dataFromServer, statusCode) {
		const message = this.setMessage (dataFromServer, statusCode);
		const closeDialogForm = this.dialog.querySelector('form[method=dialog]');
		const btn = closeDialogForm.querySelector('input[type=submit], button');

		if (message) this.container.innerHTML = message;

		// this.container.append(closeDialogForm.cloneNode(true));
		this.container.append(closeDialogForm);

		if (statusCode) {
			closeDialogForm.classList.remove('hidden');
			btn.focus();
		} else {
			closeDialogForm.classList.add('hidden');
		}

		if (this.modal) {
			this.dialog.classList.remove('modeless');
			this.dialog.showModal();
		} else {
			this.dialog.classList.add('modeless');
			this.dialog.show();
		}

		return message;
	}

	setMessage (dataFromServer, statusCode) {
		let message, type, nodelist;
		this.clearMessage();

		if (statusCode === null) {
			type = 'waiting';
			nodelist = this.waitingElems;
			this.container.classList.add('waiting');
		} else if (statusCode > 399) {
			type = 'error';
			nodelist = this.errorElems;
			this.container.classList.add('error');
			this.container.classList.remove('waiting');
		} else {
			type = 'success';
			nodelist = this.successElems;
			this.container.classList.add('success');
			this.container.classList.remove('waiting');
		}

		if (this[type]) {
			////////////////////////////////////////////////////
			// if user supplied custom message via attributes //
			////////////////////////////////////////////////////
			if (this.response === 'json') {
				// replace placeholders in user message with json data from server
				message = this.replacePlaceholders (this[type], dataFromServer)
			} else {
				// if this.response is 'html', use user message as-is
				message = this[type];
			}

		} else if (nodelist.length > 0) {
			///////////////////////////////////////////////
			// if user supplied custom message via slots //
			///////////////////////////////////////////////
			if (this.response === 'json') {
				this.replaceNodeContents(nodelist, dataFromServer);
			}

			for (const node of nodelist) {
				node.setAttribute('slot', 'message');
			}

		} else if (this.response === 'html') {
			if (statusCode === null) {
				// this is a waiting message
				message = this.default[type]
			} else {
			// use message sent from server
			message = dataFromServer;
		}
		} else {
			// use default message
			message = this.default[type];
		}

		return message;
	}

	replacePlaceholders (userdata, jsondata) {
		const fn = function (string, matches) {
			if (matches !== null) {
				for (const match of matches) {
					const prop = match.substring(2, match.indexOf('}}'));
					const keys = prop.split('.');
					let result = jsondata;
					for (const key of keys) {
						result = result[key] ?? result;
					}

					if (typeof result === 'object') {
						string = JSON.stringify(result);
					} else {
						string = string.replace(match, result);
					}
				}
			}

			return string;
		}

		let matches = userdata.match(/{{([^{}]+)}}/g);
		return fn (userdata, matches);
	}

	/**
	 * Replace innerHTML contents of elements containing {{ }} placeholders with json data coming from server.
	 * @param  {NodeList} 	nodelist	Collection of nodes assigned to a named slot
	 * @param  {String} 	response	The response from the server
	 * @return {NodeList}				The collection with placeholders replaced with data
	 */
	replaceNodeContents(nodelist, response) {
		const fn = function (node, matches) {
			if (matches !== null) {
				for (const match of matches) {
					const prop = match.substring(2, match.indexOf('}}'));
					const keys = prop.split('.');
					let result = response;
					for (const key of keys) result = result[key];
					node.innerHTML = node.innerHTML.replace(match, result);
				}
			}
		}

		for (const node of nodelist) {
			let matches = node.textContent.match(/{{([^{}]+)}}/g);
			fn (node, matches);
		}

		return nodelist;
	}

	resetForm(form) {
		// for some reason this.form.reset() is not a function ???
		const inputs = form.querySelectorAll('input, select, textarea');
		for (const input of inputs) {
			input.value = input.defaultValue || '';
		}
	}

	clearMessage() {
		this.container.classList.remove('error');
		this.container.classList.remove('success');

		for (const w of this.waitingElems) w.setAttribute('slot', 'waiting');
		for (const e of this.errorElems) e.setAttribute('slot', 'error');
		for (const s of this.successElems) s.setAttribute('slot', 'success');
	}

	cleanHTML(html) {
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		const childNodes = tmp.childNodes;
		const allowedElements = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'b', 'strong', 'i', 'hr', 'br'];
		const allowedAttributes = ['id', 'class', 'style'];

		for (let i = childNodes.length - 1; i >= 0; i--) {
			let node = childNodes[i];
			if (node.nodeType === Node.ELEMENT_NODE && !allowedElements.includes(node.localName)) {
				let textNode = document.createTextNode(node.textContent);
	      		tmp.replaceChild(textNode, node);
	    	}
	  	}

	  	return tmp.innerHTML;
	}

	validateJson(string) {
		let parsed = false;
		try {
			string = string.replaceAll(/['"<>;\s\t\n\r?()]/g, "");
			string = string.replaceAll(/([\w/\\]+)/g, '"$&"');
			parsed = JSON.parse(string);
		} catch {}

		return parsed;
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
				input.disabled = true;
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


