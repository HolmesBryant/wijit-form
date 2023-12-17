export default class WijitForm extends HTMLElement {
	#fetchOptions = {};
	#response = 'json';
	#modal = false;
	confirmation = {
		success: "<p>Thank you!.</p>",
		error: "<h2>Oopsie!</h2><p>There was an error. Please seek help.</p>",
		waiting: "<h3>Please Wait...</h3>"
	}

	error;
	success;
	waiting;
	dialog;
	form;
	wrapper;
	showSuccessFromServer = false;
	showErrorFromServer = false;
	static observedAttributes = ['modal','fetch-options', 'response'];

	constructor () {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = `
			<style>
			:host {
				--waiting-text: rgb(60,60,60);
			}

			::backdrop {
				background-color: white;
				opacity: .75;

			}

			@media (prefers-color-scheme: dark) {
				::backdrop
				{ background-color: black; }

				:host {
					--waiting-text: lightgray;
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


			::slotted(.success),
			::slotted(.error),
			::slotted(div.waiting),
			::slotted(p.waiting),
			::slotted(span.waiting),
			::slotted(h1.waiting),
			::slotted(h2.waiting),
			::slotted(h3.waiting),
			::slotted(h4.waiting)
			{
				background-color: var(--dialog-bg);
				border-radius: .5rem;
				color: var(--dialog-text);
				height: max-content;
				margin: auto;
				min-width: 200px;
				padding: .5rem;
				position: relative;
				text-align: center;
				transform: translateY(-25%);
				width: min-content;
			}

			::slotted(div.waiting)
			{ color: var(--waiting-text); }

			.hidden {
				opacity: 0;
				position: fixed;
				height: 0%;
				padding: 0;
			}

			#wrapper {
				position: relative;
			}
			</style>

			<div id="wrapper">
				<slot></slot>
				<slot name="dialog">
					<dialog class="modeless">
						<slot name="message"></slot>
						<form method="dialog" class="hidden"><button>OK</button></form>
					</dialog>
				</slot>
			</div>

			<div hidden id="responses" style="display:none">
				<slot name="waiting"></slot>
				<slot name="success"></slot>
				<slot name="error"></slot>
			</div>
		`;

		this.fetchOptions = this.getAttribute('fetch-options') || {};
		this.response = this.getAttribute('response') || this.response;
		this.diagForm = this.shadowRoot.querySelector('form[method=dialog]');
	}

	connectedCallback () {
		this.dialog = this.querySelector('dialog') || this.shadowRoot.querySelector('dialog');
		this.message = this.dialog.querySelector('[name=message]');
		this.waiting = this.getElem('waiting');
		this.success = this.getElem('success');
		this.error = this.getElem('error');
		this.form = this.querySelector('form');

		this.form.addEventListener('submit', (event) => this.submitData(event));
		this.form.addEventListener('response', (event) => this.showResponse(event));
		this.dialog.addEventListener('close', () => {
			this.form.elements[0].focus();
		});
	}

	attributeChangedCallback(attr, oldval, newval) {
		// if attribute name has hypons, camel-case it.
		if (attr.indexOf('-') > -1) {
			attr = attr.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
		}
		this[attr] = newval;
		// console.log(attr, this[attr], newval);
	}

	submitData (event) {
		event.preventDefault();
		let url = event.target.action;
		let status = 200;
		const options = this.fetchOptions;
		const data = new FormData(event.target);
		// for Accept header
		const accept = (this.response === 'html') ? "text/html" : "application/json, application/xml";

		this.message.innerHTML = '';
		this.setMessage(null, this.confirmation.waiting);
		if (this.modal) {
			this.dialog.classList.remove('modeless');
			this.dialog.showModal();
		} else {
			this.dialog.show();
		}

		options.method = event.target.method || 'GET';
		options.method = options.method.toUpperCase();
		options.headers = options.headers || {};

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

		// options.headers overrides 'accept' var
		options.headers.Accept = options.headers.Accept || accept;

		let contentType;

		fetch (url, options)
		.then (response => {
			contentType = response.headers.get('Content-Type') ?? accept;
			status = response.status;
			if (contentType.indexOf('json') > -1) {
				return response.json();
			} else {
				return response.text();
			}
		})
		.then (result => {
			const evt = new CustomEvent('response', {
				detail: {status:status, response:result, contentType: contentType}
			});

			this.form.dispatchEvent(evt);
		})
	}

	showResponse(event) {
		let response = event.detail.response;
		const status = event.detail.status;
		const contentType = event.detail.contentType;
		this.message.innerHTML = '';
		this.setMessage(status, response);
		this.diagForm.classList.remove('hidden');
		this.form.reset();
	}

	/**
	 * Sets the confirmation message.
	 * @param {integer|null} status The http status code. Null if setting the 'waiting' message.
	 *
	 * @return {Void}
	 */
	setMessage(status, response) {
		let type, nodes;
		this.clearMessage();

		switch (true) {
		case status === null:
			type = 'waiting';
			break;
		case status > 399:
			type = 'error';
			break;
		default:
			type = 'success';
			break;
		}

		if (this.response === 'html') {
			this[type][0].innerHTML = response;
			nodes = this[type];
		} else {
			nodes = this.replacePlaceholders(this[type], response);
		}

		for (const node of nodes) {
			node.classList.add(type);
			node.setAttribute('slot', 'message')
		}
	}

	clearMessage() {
		this.diagForm.classList.add('hidden');
		for (const e of this.error) e.setAttribute('slot', 'error');
		for (const s of this.success) s.setAttribute('slot', 'success');
		for (const w of this.waiting) w.setAttribute('slot', 'waiting');
	}

	replacePlaceholders(nodelist, response) {
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

	getElem(type) {
		let elems = this.querySelectorAll(`[slot=${type}]`);

		if (elems.length === 0) {
			const div = document.createElement('div');
			div.innerHTML = this.confirmation[type];
			div.classList.add(type);
			div.setAttribute('slot', type);
			this.append(div);
			elems = this.querySelectorAll(`[slot=${type}]`);
		}

		for (const elem of elems) {
			elem.addEventListener('slotchange', (event) => {
				console.log(event);
			});
		}

		return elems;
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
		if (typeof value === 'string') {
			try {
				value = JSON.parse(value);
			} catch (e) {
				value = value.replaceAll(/([\w/]+)/g, '"$&"');
				value = value.replaceAll("'", "");
				value = JSON.parse(value);
			}
		}

		this.#fetchOptions = value;
	}

	get response () { return this.#response; }
	set response (value) {
		this.#response = value;
	}
}


document.addEventListener('DOMContentLoaded', customElements.define('wijit-form', WijitForm));


