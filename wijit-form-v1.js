export default class WijitForm extends HTMLElement {
	#fetch_options = {};
	#waiting_attr = 'active';
	#waiting_delay = 500;
	dialog;
	error = "<h2>Oopsie!</h2><p>There was an error. Please get help.</p>";
	form;
	response;
	success = "<p>Thank you for sharing.</p>";
	waiting;
	waitingEffect = "<h2>Processing...</h2><p>Don't Worry. Be Happy.</p>";
	wrapper;
	showSuccessFromServer = false;
	showErrorFromServer = false;
	static observerAttributes = ['fetch_options', 'waiting_attr', 'waiting_delay'];

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
		        --fail: hsl(6, 93%, 80%);
		        --pass: hsl(112, 70%, 75%);
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
		            --primary: transparent;
		    	}
		    }

		    #wrapper {
		    	position: relative;
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
					padding: 1rem;
					text-align: center;
			    }

			    ::backdrop {
			    	backdrop-filter: blur(.3rem);
			    }

				dialog {
					border: none;
					background-color: transparent;
				}

				dialog #response,
				dialog #waiting {
					background-color: var(--bg3);
					border-radius: 1rem;
					color: var(--text);
					display: inline-block;
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

			<slot name="dialog">
				<dialog>
					<div id="waiting">
					</div>

					<div id="response" class="hidden">
						<slot name="response"></slot>
						<form method="dialog">
							<button type="submit">OK</button>
						</form>
					</div>
				</dialog>
			</slot>



			<div hidden id="responses" style="display:none">
				<slot name="waiting"></slot>
				<slot name="success"></slot>
				<slot name="error"></slot>
			</div>
		`;

		this.wrapper = this.shadowRoot.querySelector('#wrapper');
		this.fetch_options = this.getAttribute('fetch_options') || {};
		this.waitingElem = this.shadowRoot.querySelector('#waiting');
		this.responseElem = this.shadowRoot.querySelector('#response');
		this.wrapper.addEventListener('slotchange', (event) => {
			const elems = this.wrapper.querySelector('slot').assignedElements();
			for (const elem of elems) {
				this.wrapper.prepend(elem);
			}
    	});
	}

	connectedCallback () {
		this.dialog = this.querySelector('dialog') || this.shadowRoot.querySelector('dialog');
		this.error = this.querySelector('[slot=error]') || this.createDiv(this.error, 'error');
		this.success = this.querySelector('[slot=success]') || this.createDiv(this.success, 'success');
		this.waiting = this.querySelector('[slot=waiting]') || this.createDiv(this.waiting_effect, 'waiting');
		this.waiting_effect = this.querySelector('[slot=waiting-effect]') || this.createDiv(this.waiting_effect, 'waiting-effect');
		this.waiting_attr = this.getAttribute('waiting_attr') || this.waiting_attr;
		this.waiting_delay = this.getAttribute('waiting_delay') || this.waiting_delay;
		this.form = this.querySelector('form');

		this.form.addEventListener('submit', (event) => this.submitData(event));
		this.form.addEventListener('response', (event) => this.showResponse(event));

		// console.log(this.error, this.success, this.waiting_effect)
	}

	attributeChangedCallback(attr, oldval, newval) {
	}

	submitData (event) {
		event.preventDefault();
		const options = this.fetch_options;
		const data = new FormData(event.target);
		const url = event.target.action;
		let status = 200;

		this.waitingElem.classList.remove('hidden');
		this.responseElem.classList.add('hidden');
		this.dialog.showModal();
		// this.dialog.show();
		this.waiting_effect.setAttribute(this.waiting_attr, 'true');
return;
		options.method = event.target.method || 'GET';
		options.method = options.method.toUpperCase();

		if (options.method !== "GET" && options.method !== 'HEAD') {
			options.body = data;
		}

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
			this.error.innerHTML = this.replaceWithServerResponse(this.error, response);
			this.error.setAttribute('slot', 'response');
		} else {
			this.success.innerHTML = this.replaceWithServerResponse(this.success, response);
			this.success.setAttribute('slot', 'response');
		}

		this.waiting_effect.removeAttribute(this.waiting_attr);

		setTimeout (() => {
			this.waitingElem.classList.add('hidden');
			this.responseElem.classList.remove('hidden');
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

	createDiv(html, slot) {
		const div = document.createElement('div');
		div.innerHTML = html || 'Nothing to see here';
		div.setAttribute('slot', slot);
		this.append(div);
		return div;
	}

	get fetch_options () { return this.#fetch_options; }
	set fetch_options (value) {
		if (typeof value === 'string') {
			try {
				value = JSON.parse(value);
			} catch (e) {
				value = value.replaceAll(/([\w/]+)/g, '"$&"');
				value = value.replaceAll("'", "");
				value = JSON.parse(value);
			}
		}

		this.#fetch_options = value;
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


