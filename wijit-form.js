export default class WijitForm extends HTMLElement {
	#options = {};
	#waiting_attr = 'active';
	#waiting_delay = 500;
	dialog;
	error;
	form;
	response;
	success;
	waiting;
	waitingEffect;
	wrapper;
	showSuccessFromServer = false;
	showErrorFromServer = false;
	static observerAttributes = ['options', 'waiting_attr', 'waiting_delay'];

	constructor () {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = `
			<style>
			:host {
		        --bg1: rgb(250,250,250);
		        --bg2: rgb(245,245,245);
		        --bg3: white;
		        --text: rgb(60,60,60);
		        --focused: paleturquoise;
		        --border: silver;
		        --selected: lightgray ;
		        --fail: darkred;
		        --pass: limegreen;
		        --primary: dodgerblue;
		        --secondary: aliceblue ;
		    }

		    @media (prefers-color-scheme: dark) {
		    	:host {
		            --text: rgb(240,240,240);
		            --bg1: rgb(20,20,20);
		            --bg2: rgb(40,40,40);
		            --bg3: rgb(60,60,60);
		            --border: dimgray;
		            --primary: none;
		    	}
		    }

			@layer form {
				/***** Color *****/

				button,
				input,
				select
				{
					background-color: var(--bg3);
					color: var(--text);
					&:user-invalid { border-color: var(--fail) }
					&:user-valid {
						border-color: var(--pass);
					}
				}

				*[slot="response"]
				{
					background-color: var(--bg2);
					border-width: 0;
					border-radius: 10px;
					color: var(--text);
					text-align: center;
					width: clamp(200px, 50vw, 800px);

					&:focus { outline: none; }
				}

				fieldset
				{ background-color: var(--bg2); }

				form {
					background: var(--bg1);
					color: var(--text);

					*:focus { outline: 2px solid var(--focused); }
				}

				input {
					&:checked { border-color: var(--pass); }
					&:checked::after {
						background: var(--checked);
						color: var(--bg1);
					}

				}

				option:checked
				{ background-color: var(--selected); }

				.primary {
					background-color: var(--primary);
					background-image: linear-gradient(
						rgba(255,255,255,0.3),
						transparent,
						rgba(0,0,0,0.4)
					);

					color: whitesmoke;
					text-shadow: -1px -1px 1px gray;
				}

				.secondary {
					background-color: var(--secondary);
					background-image: linear-gradient(
						rgba(250,250,250,0.5),
						transparent,
						rgba(0,0,0,0.2)
					);
					color: dimgray;
				}

				.required::after {
					color: var(--error);
				}

				/***** Structure *****/

				*[slot=response]
				{ overflow: hidden; }

				button,
				input,
				select,
				textarea
				{
				    border: 1px solid var(--border);
					border-radius: 5px;
					font-size: inherit;
					min-height: 35px;
					min-width: 35px;
				    padding: .25rem;
				    vertical-align: middle;

				    &:hover { box-shadow: 2px 2px 5px rgba(0,0,0,0.5); }
				    &:active { box-shadow: inset 2px 2px 5px rgba(0,0,0,0.5); }
				    &:disabled { opacity: 0.5 }
				}

				button,
				input[type="checkbox"],
				input[type="radio"],
				input[type="reset"],
				input[type="submit"],
				label
				{
					cursor: pointer;
					font-weight: bold;
				}

				div,
				fieldset
				{ margin: 1rem 0; }

				fieldset
				{
					border: 1px solid var(--border);
					border-radius: 5px;
				}

				form
				{
					border-radius: 10px;
					padding: 1rem;
				}

				form *
				{ box-sizing: border-box; }

				input[type="checkbox"],
				input[type="radio"]
				{
					appearance: none;
					border: 1px solid var(--border);
					padding: 10px;
					display: inline-block;
					overflow: hidden;
					position: relative;

					&::after
					{
						align-items: center;
						border: none;
						content: "";
						color: var(--bg2);
						display: flex;
						justify-content: center;
						line-height: 0;
						position: absolute;
						top: 0;
						bottom: 0;
						left: 0;
						right: 0;
					}

					&:checked { background-color: var(--selected); }
					&:checked::after { content: "⬤"; }
				}

				input[type="radio"]
				{ border-radius: 50%; }

				label {
					margin: 0 .5rem;
				}

				legend
				{ font-weight: bold; }

				option /* multiple select */
				{ padding: .5rem }

				select
				{
					font-size: larger;
					overflow: auto;

					&:disabled { display: none; }
					&:valid { border-color: var(--pass); }
				}

				.required:after
				{
					content: " Required";
					font-size: xx-small;
					font-weight: bold;
					vertical-align: super;
				}
				} /* @form */

			@layer dialog {
			    ::slotted([slot=waiting]) {
			    	width: 100%;
			    	overflow: hidden;
			    }

				dialog {
					backdrop-filter: blur(.3rem);
					border-width: 0;
			    	border-radius: 1rem;
					box-sizing: border-box;
					background: none;
					overflow: hidden;
					padding: 0;
					text-align: center;
					width: 100%;
					height: 100%;
				}

				dialog #response,
				dialog #waiting {
					border-radius: 1rem;
					margin: auto;
					position: static;
					opacity: 1;
					padding: 0;
					transition: all .5s;
				}

				dialog #response {
					background-color: var(--bg3);
					border: 1px solid var(--focused);
					color: var(--text);
					height: max-content;
					margin: auto;
					padding: 1rem;
					width: max-content;
				}

				dialog #waiting {
					width: 100%;
					height: 100%;
				}

				dialog form {
					background-color: transparent;
					background-image: none;
				}
			} /* @dialog */

			@layer flex {
				.flex { display: flex; }
				.column { flex-direction: column }
				.column-reverse { flex-direction: column-reverse; }
				.row { flex-direction: row; }
				.row-reverse { flex-direction: row-reverse; }
				.center {
					align-content: center;
					align-items: center;
					gap: 1rem;
					justify-content: center;
					justify-items: center;
				}
				.start.column,
				.start.row
				{
					align-items: center;
					justify-content: flex-start;
				}

				.start.column-reverse,
				.start.row-reverse
				{
					align-items: center;
					justify-content: flex-end;
				}

				.end.column,
				.end.row
				 {
					align-items: center;
					justify-content: flex-end;
				}

				.end.column-reverse,
				.end.row-reverse
				{
					align-items: center;
					justify-content: flex-start;
				}
			} /* @flex */

			.hidden {
				opacity: 0;
				position: fixed;
				height: 0%;
				padding: 0;
			}
			</style>

			<div id="wrapper">
				<slot></slot>
			</div>

			<dialog>
				<div id="waiting">
					<slot name="waiting"></slot>
				</div>

				<div id="response" class="hidden">
					<slot name="response"></slot>
					<form method="dialog">
						<button type="submit">OK</button>
					</form>
				</div>
			</dialog>

			<div hidden id="responses" style="display:none">
				<slot name="success"></slot>
				<slot name="error"></slot>
			</div>
		`;

		this.wrapper = this.shadowRoot.querySelector('#wrapper');
		this.options = this.getAttribute('options') || {};
		this.dialog = this.shadowRoot.querySelector('dialog');
		this.waiting = this.dialog.querySelector('#waiting');
		this.response = this.dialog.querySelector('#response');

		this.wrapper.addEventListener('slotchange', (event) => {
			const elems = this.wrapper.querySelector('slot').assignedElements();
			for (const elem of elems) {
				this.wrapper.prepend(elem);
			}
    	});
	}

	connectedCallback () {
		this.error = this.querySelector('[slot=error]');
		this.success = this.querySelector('[slot=success]');
		this.waitingEffect = this.querySelector('[slot=waiting]');
		this.waiting_attr = this.getAttribute('waiting_attr') || this.waiting_attr;
		this.waiting_delay = this.getAttribute('waiting_delay') || this.waiting_delay;
		this.form = this.querySelector('form');

		this.form.addEventListener('submit', (event) => this.submitData(event));
		this.form.addEventListener('response', (event) => this.showResponse(event));

		if (this.success.textContent.indexOf('{{') > -1) {
			this.showSuccessFromServer = true;
		}

		if (this.error.textContent.indexOf('{{') > -1) {
			this.showErrorFromServer = true;
		}
	}

	attributeChangedCallback(attr, oldval, newval) {
		this[attr] = newval;
	}

	submitData (event) {
		event.preventDefault();
		const options = this.options;
		const data = new FormData(event.target);
		const url = event.target.action;
		let status = 200;

		this.waiting.classList.remove('hidden');
		this.response.classList.add('hidden');
		this.dialog.showModal();
		this.waitingEffect.setAttribute(this.waiting_attr, 'true');

		options.method = event.target.method || 'GET';
		options.body = data;

		fetch (url, options)
		.then (response => {
			const ctype = response.headers.get('Content-Type');
			status = response.status;
			if (ctype.indexOf('application/json') > -1) {
				return response.json();
			} else {
				return response.text();
			}
		})
		.then (result => {
			const evt = new CustomEvent('response', {
				detail: {status:status, response:result}
			});

			this.form.dispatchEvent(evt);
		})
	}

	showResponse(event) {
		let matches;
		let response = event.detail.response;
		const status = event.detail.status;

		if (status > 399) {
			// if (this.showErrorFromServer) {
				this.error.innerHTML = this.replaceWithServerResponse(this.error, response);
			// }

			this.error.setAttribute('slot', 'response');
		} else {
			// if (this.showSuccessFromServer) {
				this.success.innerHTML = this.replaceWithServerResponse(this.success, response);
			// }

			this.success.setAttribute('slot', 'response');
		}

		this.waitingEffect.removeAttribute(this.waiting_attr);

		setTimeout (() => {
			this.waiting.classList.add('hidden');
			this.response.classList.remove('hidden');
		}, this.waiting_delay);

		this.form.reset();
		this.form.elements[0].focus();
	}

	replaceWithServerResponse(elem, response) {
		let matches = elem.textContent.match(/{{([^{}]+)}}/g);

		const fn = function (matches) {
			if (typeof matches !== 'object' || matches === null) {
				// Why is matches someimes null, but relacement still works?
				// console.debug('matches:', matches);
				return;
			}

			for (const match of matches) {
				const prop = match.substring(2, match.indexOf('}}'));
				const keys = prop.split('.');
				let result = response;

				for (let key of keys) {
					result = result[key];
				}

				elem.innerHTML = elem.innerHTML.replace(match, result);
			}
		}

		fn (matches);
		return elem.innerHTML;
	}

	get options () { return this.#options; }
	set options (value) {
		if (typeof value === 'string') {
			try {
				value = JSON.parse(value);
			} catch (e) {
				value = value.replaceAll(/([\w/]+)/g, '"$&"');
				value = value.replaceAll("'", "");
				value = JSON.parse(value);
			}
		}

		this.#options = value;
	}

	get waiting_attr () { return this.#waiting_attr; }
	set waiting_attr (value) {
		this.#waiting_attr = value;
	}

	get waiting_delay () { return this.#waiting_delay; }
	set waiting_delay (value) {
		this.#waiting_delay = parseFloat(value);
	}
}


document.addEventListener('DOMContentLoaded', customElements.define('wijit-form', WijitForm));


