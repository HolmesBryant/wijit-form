/**
 * @class WijitForm
 * @summary Represents a custom form component for handling form submissions, data fetching, and dialog display.
 * @remarks This class extends HTMLElement, allowing it to be used as a custom HTML element in web pages.
 * @author Holmes Bryant <https://github.com/HolmesBryant>
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
	#resetForm = true;

	#server = true;

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
	static observedAttributes = [
		'custom-css',
		'dialog-message-id',
		'error',
		'fetch-options',
		'force-error',
		'modal',
		'reset-form',
		'response',
		'success',
		'waiting'
	];

	constructor () {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = `
			<style id="wijit-form-css">
				@layer wijit-form {

					wijit-form {
				    --accent-color: orange;
				    --bg1-color: rgb(250,250,250);
				    --bg2-color: rgb(245,245,245);
				    --bg3-color: white;
				    --border-color: silver;
				    --fail-color: hsl(6, 93%, 80%);
				    --pass-color: hsl(112, 70%, 75%);
				    --text-color-: rgb(40,40,40);
				    --text-color-light: rgb(240,240,240);
				    --text-color-dark: rgb(40,40,40);
				    --gap: .5rem;
				    --min: 35px;
				    --min-panel: 260px;
				    --pad: .5rem;

				    background-color: var(--bg1-color);
				    border-radius: 10px;
				    color: var(--text-color);
				    display: inline-block;
				    padding: var(--pad);
				    width: 100%;
				    overflow: auto;
				    scrollbar-gutter: stable both-edges;
						scrollbar-color: var(--bg2-color) var(--bg3-color);
					}

					wijit-form > * {
						box-sizing: border-box;
					}

					@media (prefers-color-scheme: dark) {
				 		wijit-form {
			        --bg1-color: rgb(35,35,35);
			        --bg2-color: rgb(40,40,40);
			        --bg3-color: rgb(60,60,60);
			        --border-color: dimgray;
			        --text-color: rgb(240,240,240);
				 		}
				   }

				   @media only screen and (max-width: 380px) {
				   	wijit-form {
				   		--pad: 0;
				   		--gap: .25rem;
				   	}
				   }
				} /* layer */

		    /*********************/
		    /**** Backgrounds ****/
		    /*********************/

			    wijit-form details > *,
			    wijit-form fieldset,
			    wijit-form section
			    { background-color: var(--bg2-color); }

			    wijit-form button,
			    wijit-form input,
			    wijit-form input::before,
			    wijit-form progress,
			    wijit-form select,
			    wijit-form textarea
			    { background-color: var(--bg3-color); }

			    wijit-form hr
			    { background-color: silver; }

			    wijit-form .primary,
			    wijit-form option:checked
			    { background-color: var(--accent-color); }

			    wijit-form progress::-webkit-progress-value
			    { background-color: var(--accent-color); }

					wijit-form progress::-moz-progress-bar
					{ background-color: var(--accent-color); }

			    wijit-form .error
			    { background-color: var(--fail-color); }

			    wijit-form .success
			    { background-color: var(--pass-color); }

			    wijit-form input[type=range]::-webkit-slider-thumb
			    { background-color: var(--accent-color); }

			    wijit-form input[type=range]::-moz-range-thumb
			    { background-color: var(--accent-color); }

		    /********************************/
		    /****** Borders / Outlines ******/
		    /********************************/

			    wijit-form button,
			    wijit-form fieldset,
			    wijit-form input,
			    wijit-form input::before,
			    wijit-form progress,
			    wijit-form select,
			    wijit-form textarea,
			    wijit-form .error,
			    wijit-form .success
			    { border: 1px solid var(--border-color); }

			    wijit-form option
			    { border-bottom: 1px solid var(--border-color); }

			    wijit-form hr,
			    wijit-form option:last-child
			    { border: none; }

			    wijit-form input:user-valid:not([type="submit"]):not([type="reset"]):not([type="range"])
			    { border-color: var(--pass-color) }

			    wijit-form :user-invalid
			    { border-color: var(--fail-color) }

			    wijit-form .success
			    { border-color: var(--pass-color); }

			    wijit-form .error
			    { border-color: var(--fail-color); }

					wijit-form button,
					wijit-form fieldset,
					wijit-form hr,
					wijit-form input,
					wijit-form input::before,
					wijit-form option,
					wijit-form progress,
					wijit-form progress::-webkit-progress-value,
					wijit-form progress::-webkit-progress-bar,
					wijit-form section,
					wijit-form select,
					wijit-form textarea,
					wijit-form .error,
					wijit-form .success
					{ border-radius: .5rem; }

					wijit-form input[type=range]::-webkit-slider-thumb
			    { border-radius: 50%; }

			    wijit-form input[type=range]::-moz-range-thumb
			    { border-radius: 50%; }

					wijit-form input[type="radio"],
					wijit-form input[type="radio"]::before
					{ border-radius: 50%; }

					wijit-form option
					{ border-radius: 0; }

					wijit-form option:first-child
					{ border-radius: .5rem .5rem 0 0; }

					wijit-form option:last-child
					{ border-radius: 0 0 .5rem .5rem; }

			    wijit-form :focus-visible
			    {
			    	border-color: transparent;
			    	outline: 1px solid var(--accent-color);
			    }

			    wijit-form input:checked::before
			    { outline: 2px solid var(--accent-color); }

		    /******************************/
		    /*********** Accent ***********/
		    /******************************/

			    wijit-form input,
			    { accent-color: var(--accent-color); }

		    /******************************/
		    /************ Text ************/
		    /******************************/

			    wijit-form label.required:after
			    { color: var(--fail-color) }

			    wijit-form button,
			    wijit-form input,
			    wijit-form fieldset,
			    wijit-form label,
			    wijit-form legend,
			    wijit-form option,
			    wijit-form select,
			    wijit-form textarea
			    { color: var(--text-color); }

			    wijit-form .primary,
			    wijit-form option:checked
			    { color: var(--text-color-light); }

			    wijit-form input:checked::before {
			      color: var(--accent-color);
			    }

			    wijit-form option,
			    wijit-form button,
			    wijit-form input,
			    wijit-form fieldset,
			    wijit-form label,
			    wijit-form legend,
			    wijit-form option,
			    wijit-form select,
			    wijit-form textarea
			    {
			        font-size: 1rem;
			        letter-spacing: .1rem;
			    }

			    wijit-form input[type="checkbox"]::before,
			    wijit-form input[type="radio"]::before
			    { font-size: var(--min); }

			    wijit-form label.required:after
			    { font-size: small }

			    wijit-form select:not([multiple]):not([size]) option {
						font-size: larger;
					}

			    wijit-form button,
			    wijit-form input[type="button"],
			    wijit-form input[type="reset"],
			    wijit-form input[type="submit"],
			    wijit-form label,
			    wijit-form legend,
			    wijit-form option,
			    wijit-form select,
			    wijit-form .error,
			    wijit-form .success
			    { font-weight:bold; }

			    wijit-form .error,
			    wijit-form .success
			    { text-align: center; }

			    wijit-form .primary,
			    wijit-form option:checked
			    { text-shadow: 1px 1px 1px black; }

		    /*********************/
		    /****** Shadows ******/
		    /*********************/

			    wijit-form  button:hover,
			    wijit-form input[type="button"]:hover,
			    wijit-form input[type="image"]:hover,
			    wijit-form input[type="submit"]:hover,
			    wijit-form input[type="reset"]:hover,
			    wijit-form option:hover
			    { box-shadow: 2px 2px 5px black; }

			    wijit-form button:active,
			    wijit-form input[type="button"]:active,
			    wijit-form input[type="image"]:active,
			    wijit-form input[type="submit"]:active,
			    wijit-form input[type="reset"]:active,
			    wijit-form option:active,
			    wijit-form option:checked
			    { box-shadow: inset 2px 2px 5px black; }

			    wijit-form input[type=range]::-webkit-slider-thumb:hover {
		        box-shadow: 2px 2px 5px black;
		      }

		      wijit-form input[type=range]::-moz-range-thumb:hover {
		        box-shadow: 2px 2px 5px black;
		      }

		      wijit-form input[type=range]:active::-webkit-slider-thumb {
		        box-shadow: inset 2px 2px 5px black;
		      }

		      wijit-form input[type=range]:active::-moz-range-thumb {
		        box-shadow: inset 2px 2px 5px black;
		      }

		      wijit-form input[type=range]:focus::-webkit-slider-thumb {
		        box-shadow: inset 2px 2px 5px black;
		      }

		      wijit-form input[type=range]:focus::-moz-range-thumb {
		        box-shadow: inset 2px 2px 5px black;
		      }

		    /*********************/
		    /******* Cursor ******/
		    /*********************/

			    wijit-form input[type="button"],
			    wijit-form input[type="checkbox"],
			    wijit-form input[type="radio"],
			    wijit-form input[type="color"],
			    wijit-form input[type="range"],
			    wijit-form input[type="reset"],
			    wijit-form input[type="submit"],
			    wijit-form label,
			    wijit-form button,
			    wijit-form select
			    { cursor: pointer; }

			    wijit-form input:disabled,
			    wijit-form *[disabled]
			    { cursor: not-allowed; }

		    /*********************/
		    /***** Structure *****/
		    /*********************/

			    wijit-form button,
			    wijit-form input[type=submit],
			    wijit-form input[type=reset] {
			    	margin: var(--gap);
			    }

			    wijit-form button,
					wijit-form input {
			    	min-height: var(--min);
			    	min-width: var(--min);
			    	padding: var(--pad);
					}

					wijit-form div {
						align-items: stretch;
						display: flex;
						flex-direction: column;
						flex-wrap: wrap;
						gap: 0 var(--gap);
						justify-content: center;
						margin: 1rem 0;
					}

					wijit-form div.row
					{ align-items: center; }

					wijit-form div > *,
					wijit-form fieldset > *,
					wijit-form section > *
					{ flex: 1; }

					wijit-form fieldset {
						display: flex;
						flex-direction: column;
						flex-wrap: wrap;
						gap: var(--gap);
						overflow-x: hidden;
						overflow-y: auto;
						padding: var(--pad);
				  	min-inline-size: var(--min-panel);
					}

					wijit-form header {
						display: block;
						flex-grow: 0;
						flex-shrink: 0;
					}

					wijit-form hr {
						min-width: 100%;
						max-height: 5px;
					}

					wijit-form .row > hr {
						min-width: 5px;
						margin: 0;
						max-width: 5px;
						max-height: 100%;
					}

			    wijit-form input:disabled {
			      opacity: 0.7;
			    }

					wijit-form input[type="checkbox"],
					wijit-form input[type="radio"] {
      			appearance: none;
			      height: var(--min);
			      position: relative;
			      width: var(--min);
			    }

			    wijit-form input:checked::before {
			      content: "";
			      line-height: 0;
			      position: absolute;
			      display: flex;
			      height: 100%;
			      width: 100%;
			      align-items: center;
			      justify-content: center;
			    }

			    wijit-form input[type="checkbox"]:checked::before {
			    	content: "✔";
			    }

			    wijit-form input[type="radio"]:checked::before {
			      content: "⬤";
			    }

			    wijit-form input[type="color"],
			    wijit-form input[type="checkbox"],
			    wijit-form input[type="radio"] {
			    	flex: 0;
			    	flex-basis: var(--min);
			    	padding: 0;
			    	width: var(--min);
			    }

			    wijit-form input[type=file]::file-selector-button {
			    	background-color: var(--bg2-color);
		    		border: 1px solid var(--border-color);
		    		border-radius: .5rem;
		    		color: var(--text-color);
		    		font-weight: bold;
		    		padding: var(--pad);
			    }

			    /***** Range *****/

			    wijit-form div:has(input[type=range]) > label::after {
			    	content: attr(data-value);
			    	margin: 0 var(--gap);
			    	font-weight: normal;
			    }

			    wijit-form input[type=range] {
			    	appearance: none;
			    	-webkit-appearance: none;
		        width: 100%;
		        cursor: pointer;
		        outline: none;
		        padding: 0;
		        max-height: var(--pad);
		        min-height: var(--pad);
		      }

		      wijit-form input[type=range]::-webkit-slider-thumb {
		        -webkit-appearance: none;
		        height: var(--min);
		        width: var(--min);
		      }

		      wijit-form input[type=range]::-moz-range-thumb {
		      	appearance: none;
		        height: var(--min);
		        width: var(--min);
		      }

		      /***** /Range *****/

		      wijit-form div:has(input[type=range]) > label {
		      	margin-bottom: var(--gap);
		      }

					wijit-form label {
						flex: 0;
						white-space: nowrap;
					}

					wijit-form option {
						padding: var(--pad);
					}

					wijit-form progress {
						-webkit-appearance: none;
						-moz-appearance: none;
						appearance: none;
						inline-size: 100%;
						min-height: 1rem;
					}

					wijit-form div:has(progress) label::after {
						content: attr(data-value);
						font-weight: normal;
						margin: 0 var(--gap);
					}

					wijit-form progress::-webkit-progress-value
					{ min-height: 1rem; }

					wijit-form section {
						display: flex;
						flex-direction: column;
						flex-wrap: wrap;
						gap: var(--gap);
						overflow: auto;
						padding: var(--pad);
				  	min-inline-size: var(--min-panel);
					}

					wijit-form section + section
					{ margin: 1rem 0; }

					wijit-form select {
			    	min-height: var(--min);
			    	min-width: var(--min);
			    	overflow-y: auto;
					}

			    wijit-form textarea
			    {
			    	min-height: 5rem;
			    	min-width: 10rem;
			    	padding: var(--pad);
			    	width: 100%;
			    }

			    wijit-form .required:after {
			    	content: "*";
			    	font-size: x-large;
			    	vertical-align: super;
			    }

			   /**** Classes ****/

					wijit-form .center > *,
					wijit-form .start > *,
					wijit-form .end > *,
					wijit-form .space-around > *,
					wijit-form .space-between > *
					{ flex: 0 1 max-content; }

					wijit-form .center {
						justify-content: center;
						align-items: center;
					}

					wijit-form .end {
						align-content: flex-end;
						justify-content: flex-end;
					}

					wijit-form .reverse.end {
						align-content: flex-start;
						justify-content: flex-start;
					}

					wijit-form .nowrap
					{ flex-wrap: nowrap}

					wijit-form .reverse
					{ flex-direction: column-reverse; }

					wijit-form .row
					{ flex-direction: row; }

					wijit-form .row.reverse
					{ flex-direction: row-reverse; }

					wijit-form .space-around {
						justify-content: space-around;
						align-content: space-around;
					}

					wijit-form .space-between {
						justify-content: space-between;

					}

					wijit-form .row.space-between {
						align-content: space-between;
					}

					wijit-form .start {
						/*align-content: flex-start;*/
						/*justify-content: flex-start;*/
					}

					wijit-form .row.start {}

					wijit-form .reverse.start {
						align-content: flex-end;
						justify-content: flex-end;
					}

					wijit-form .flex0 {
						flex: 0;
					}

					wijit-form .flex1 {
						flex: 1;
					}

					wijit-form .flex2 {
						flex: 2;
					}
			</style>

			<style>
				:host {
					--fail-color: darksalmon;
					--pass-color: limegreen;
				}

				button {
					background-color: var(--accent-color);
					border-color: var(--border-color);
					border-radius: 5px;
					cursor: pointer;
					font-size: large;
					font-weight: bold;
					outline-color: var(--accent-color);
					padding: var(--pad);
				}

				button:hover,
				button:focus {
					box-shadow: 2px 2px 5px black;
				}

				button:active {
					box-shadow: inset 2px 2px 5px black;
				}

				dialog {
					background: transparent;
					border: none;
					box-sizing: border-box;
					color: var(--text-color);
					outline: none;
					text-align: center;
				}

				dialog::backdrop {
					background-color: white;
					color: black;
					opacity: 0.75;
				}

				dialog.modeless {
					accent-color: transparent;
					backdrop-filter: blur(.3rem);
					height: 100%;
					outline: none;
					overflow: hidden;
					padding: 0;
					top: 0;
					width: 100%;
				}

				dialog.modeless[open] {
					display: table;
				}

				.hidden
				{ display: none; }

				#dialog-message {
					background-color: var(--bg3-color);
					border: 1px solid var(--border-color);
					border-radius: 10px;
					display: table-cell;
					padding: 1rem;
					vertical-align: middle;
				}

				dialog.modeless #dialog-message {
					transition: all 1s;
				}

				#dialog-message.waiting {
					background-color: transparent;
					border: none;
					margin: auto;
					padding: 0;
					width: auto;
				}

				#dialog-message.error {
					border-color: var(--fail-color);
				}

				#dialog-message.success {
					border-color: var(--pass-color);
				}

				#wrapper {
					position: relative;

				}

				@media (prefers-color-scheme: dark) {
					dialog::backdrop {
						background-color: black;
						color: white;
					}
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

		if ( !this.customCss ) this.addDefaultCss();

		this.handleRangeInputs( this.querySelectorAll( 'input[type=range]' ));

		this.handleProgressElems( this.querySelectorAll( 'progress' ));

		if ( this.form ) {
			this.form.addEventListener('submit', (event) => this.submitData(event), {signal: this.mainAbortController.signal});
		}

		this.dialog.addEventListener( 'close', event => {
			if ( this.reset ) this.resetFormElements( this.form );
		}, { signal:this.mainAbortController.signal } );
		this.addFocusListeners();
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
	attributeChangedCallback ( attr, oldval, newval ) {
		// if attribute name has hypons, camel-case it.
		if (attr.indexOf('-') > -1) {
			attr = attr.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
			attr = attr.replace(attr.charAt(0), attr.charAt(0).toLowerCase());
		}

		this[attr] = newval;
		// console.log(attr, newval)
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
	async submitData( event ) {
		event.preventDefault();
		if (event.target.action.endsWith( 'false')) return;
		let url, result;
		const data = new FormData ( event.target );
		const accept = ( this.response === 'html' ) ? "text/html" : "application/json";
		const options = this.setFetchOptions( event, accept );

		if (!this.testing) this.showDialog( this.waiting, null );

		if ( event.target.action.endsWith( 'test' ) ) {
			this.#server = false;
		} else {
			this.#server = true;
			url = event.target.action;
		}

		if ( options.method === 'GET' || options.method === 'HEAD' ) {
			let i = 0;
			url += '?';
			for ( const entry of data.entries() ) {
				url += (i === 0) ? entry.join('=') : `&${entry.join('=')}`;
				i++;
			}
			url = encodeURI( url );
		} else {
			options.body = data;
		}

		if ( this.#server ) {
			result = await this.fetchData( url, options );
			if ( this.testing ) {
				return this.setMessage( result.data, result.status );
			} else {
				this.showDialog( result.data, result.status );
			}
		} else {
			result = this.simulateServer( options );
			setTimeout ( () => {
				this.showDialog( result.data, result.status );
			}, 1000 );
		}
	}

	/**
	 * @summary Send data to server and return result
	 * @param  	{string} url     	The url to the server
	 * @param  	{object} options 	Options object for Fetch
	 * @returns {object}			{data: string, status: number}
	 */
	async fetchData( url, options ) {
		let data;

		try {
			const response = await fetch (url, options);
			const status = response.status;
			const contentType = response.headers.get('Content-Type');
			const data = contentType.includes('json') ? await response.json() : await response.text();
			return {data:data, status:status};
		} catch (error) {
			// console.error (error);
			return {data: '<h1>Server Error</h1>', status: status}
		}
	}

	/**
	 * @summary Simulate server response for testing without a server side script.
	 * @param {object} 	data 	An object containing simulated request data.
	 * @returns {object} 		An object with the following properties:
	 *                        	- data: The simulated response data.
	 *                         	- status: The HTTP status code of the simulated response.
	 */
	simulateServer( data ) {
		let msg, status;
		const formdata = data.body;
		const caveat = '<p>This result is a simulation. No server side form processing was performed.';

		data.data =  Object.fromEntries(formdata.entries());
		delete (data.body);

		if (this.forceError) {
			status = 500;
			if (this.response === 'html') {
				msg = '<h1>Error</h1><p>HTML response</p>';
				msg += caveat;
			} else {
				msg = data;
			}
		} else {
			status = 200;
			if (this.response === 'html') {
				msg = '<h1>Success</h1><p>HTML response</p>';
				msg += caveat;
			} else {
				msg = data;
			}
		}

		return {data:msg, status:status};
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
	setFetchOptions( event, accept ) {
		const options = (this.fetchOptions) ? JSON.parse (JSON.stringify (this.fetchOptions)) : {};
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
	showDialog( dataFromServer, statusCode ) {

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
	setMessage( messageFromServer, statusCode ) {

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

		if (this[type] !== null && this[type] !== undefined) {
			// type != "waiting" AND user-supplied custom message via attributes
			if (this.response === 'json') {
				// replace user placeholders with data from server
				message = this.replacePlaceholders(this[type], messageFromServer);
			} else {
				// Use whatever user has given
				message = this[type];
			}

		} else if (nodeList.length > 0) {
			// type could be "waiting" and user-supplied custom message via slots
			if (this.response === 'json') {
				this.replaceNodeContents(nodeList, messageFromServer);
			}

			nodeList.forEach(node => node.setAttribute('slot', 'message'));

		} else if (this.response === 'html') {
			if (statusCode === null) {
				// type === "waiting". Set default "Waiting" message
				message = this.default[type];
			} else {
				// type !== "waiting". Use whatever the server sends
				message = messageFromServer;
			}
		} else {
			// Default message
			message = this.default[type];
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
	replacePlaceholders( userdata, jsondata ) {
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

		return text.replaceAll('"', '');
	}

	/**
	 * Replace innerHTML contents of elements containing {{ }} placeholders with json data coming from server.
	 * @param  {NodeList} 	nodelist	Collection of nodes assigned to a named slot
	 * @param  {String} 	response	The response from the server
	 * @return {NodeList}				The collection with placeholders replaced with data
	 */
	replaceNodeContents( nodeList, response ) {
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

	addFocusListeners() {
		if (!this.form) return;
		for ( const input of this.form.elements ) {
			if ( input.localName === 'textarea' ) continue;
			input.addEventListener( 'focus', () => {
				if ( typeof input.select === 'function' ) input.select();
			}, { signal:this.mainAbortController.signal } );
		}
	}

	/**
	 * Resets form inputs to default values
	 * @param  {HTMLElement} form The html form
	 * @returns {Void}
	 */
	resetFormElements( form ) {
		const inputs = form.querySelectorAll('input, select, textarea');
		try {
			this.form.reset();
			inputs[0].focus();
		} catch (error) {
			console.debug(typeof this.form.reset, this.form);
			console.error(this);
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
	cleanHTML( html ) {
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
	validateJson( string ) {
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

	handleRangeInputs( collection ) {
		if ( collection.length === 0 ) return;
		for ( const input of collection ) {
			const prog = (input.value / input.max) * 100;
			const label = input.parentElement.querySelector('label');
			const dval = input.getAttribute('data-value');

			if (dval) {
				const newval = dval.replace(/[\d]+/, input.value);
				label.setAttribute('data-value', newval);
			}

			input.style.background = `linear-gradient(to right, var(--accent-color) ${prog}%, transparent ${prog}%)`;


			input.addEventListener("input", (event) => {
        const progress = (event.target.value / input.max) * 100;

        if (dval) {
	        const newval = dval.replace(/[\d]+/, input.value);
					label.setAttribute('data-value', newval);
        }

        input.style.background = `linear-gradient(to right, var(--accent-color) ${progress}%, transparent ${progress}%)`;
      });
		}
	}

	handleProgressElems( collection ) {
		if ( collection.length === 0 ) return;

		const setLabel = function (elem) {
			const label = elem.parentElement.querySelector('label');
			const dval = elem.getAttribute('data-value');

			if (dval) {
				const newval = dval.replace(/[\d]+/, elem.value);
				label.setAttribute('data-value', newval);
			}
		}

		const observer = new MutationObserver((mutations) => {
  		mutations.forEach((mutation) => {
    		if (mutation.attributeName === "value") {
      		const newValue = mutation.target.value;
      		setLabel(mutation.target);
    		}
  		});
		});

		const config = { attributes: true, attributeFilter: ["value"] };

		for ( const elem of collection ) {
			setLabel (elem);
			observer.observe(elem, config);
		}
	}

	addDefaultCss() {
		const style = document.head.querySelector('#wijit-form-css');
		if (!style) document.head.append (this.defaultCss());
	}

	/**
	 * @summary Returns a Style element containing css rules.
	 * @returns {HTMLStyleElement}
	 */
	defaultCss() {
		return this.shadowRoot.querySelector('#wijit-form-css')
	}

	/**
	 * @returns {boolean}
	 */
	get customCss() { return this.#customCss }
	set customCss( value ) {
		switch (value) {
		case '':
		case 'true':
			value = true;
			this.addDefaultCss();
			break;
		default:
			value = false;
			if (document.head.querySelector('style#wijit-form-css')) style.remove();
		}

		this.#customCss = value;
	}

	/**
	 * @returns {string}
	 */
	get dialogMessageId() { return this.#dialogMessageId }
	set dialogMessageId( value ) {
		this.#dialogMessageId = value;
	}

	/**
	 * @returns {object}
	 */
	get fetchOptions() { return this.#fetchOptions; }
	set fetchOptions( value ) {
		value = this.validateJson(value);
		if (value === null) {
			this.#fetchOptions = {};
		} else {
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
	set forceError( value ) {
		let input = this.form.querySelector('input[name=fail]');

		switch (value.toLowerCase()) {
		case '':
		case 'true':
		case true:
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
	get modal() { return this.#modal; }
	set modal( value ) {
		switch (value.toLowerCase()) {
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
	get resetForm () { return this.#resetForm; }
	set resetForm ( value ) {
		switch (value.toLowerCase()) {
		case '':
		case 'true':
			value = true;
			break;
		default:
			value = false;
		}

		this.#resetForm = value;
	}

	/**
	 * @returns {string}
	 */
	get response () { return this.#response; }
	set response ( value ) {
		this.#response = value.toLowerCase();
	}

	/**
	 * @returns {string}
	 */
	get error () { return this.#error; }
	set error ( value ) {
		value = this.cleanHTML(value);
		switch (value) {
			case 'null':
				value = null;
				break;
		}
		this.#error = value;
	}

	/**
	 * @returns {string}
	 */
	get success () { return this.#success; }
	set success ( value ) {
		value = this.cleanHTML(value);
		switch (value) {
			case 'null':
				value = null;
				break;
		}
		this.#success = value;
	}

	/**
	 * @returns {string}
	 */
	get waiting () { return this.#waiting; }
	set waiting ( value ) {
		value = this.cleanHTML(value);
		switch (value) {
			case 'null':
				value = null;
				break;
		}
		this.#waiting = value;
	}
}

class WijitRange extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const track = document.createElement('div');
    track.classList.add('track');

    const thumb = document.createElement('div');
    thumb.classList.add('thumb');

    this.shadow.append(track, thumb);

    this.min = this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0;
    this.max = this.hasAttribute('max') ? parseFloat(getAttribute('max')) : 100;
    this.value = this.hasAttribute('value') ? parseFloat(this.getAttribute('value')) : this.min;

    thumb.addEventListener('mousedown', (event) => this.onMouseDown(event));

    track.style.width = '100%';
    track.style.height = '10px';
    track.style.backgroundColor = '#ddd';
    track.style.borderRadius = '5px';

    thumb.style.position = 'absolute';
    thumb.style.width = '20px';
    thumb.style.height = '20px';
    thumb.style.backgroundColor = 'blue';
    thumb.style.borderRadius = '50%';
    thumb.style.cursor = 'pointer';

    this.updateThumbPosition();
  }

  onMouseDown(event) {
    event.preventDefault();
    this.dragging = true;

    // Calculate initial offset relative to the thumb itself
    const rect = this.shadow.querySelector('.thumb').getBoundingClientRect();
    this.offsetX = event.clientX - rect.left;
    this.offsetY = event.clientY - rect.top;
  }

  onMouseMove(event) {
    if (!this.dragging) return;

    const rect = this.shadow.getBoundingClientRect();
    const clientX = event.clientX - this.offsetX;
    const clientY = event.clientY - this.offsetY;

    // Constrain movement within the shadow DOM boundaries
    const leftLimit = 0;
    const rightLimit = rect.width - this.shadow.querySelector('.thumb').offsetWidth;
    const topLimit = 0; // Assuming vertical movement is not allowed
    const bottomLimit = rect.height - this.shadow.querySelector('.thumb').offsetHeight;

    let newLeft = Math.min(Math.max(clientX, leftLimit), rightLimit);
    // Restrict top and bottom movement (assuming horizontal movement only)
    const newTop = bottomLimit;

    const percentageX = (newLeft - leftLimit) / (rightLimit - leftLimit);

    // Update value based on horizontal movement
    this.value = this.min + percentageX * (this.max - this.min);
    this.updateThumbPosition(newLeft, newTop); // Pass calculated positions

    // Dispatch an event to notify listeners about the change
    const changeEvent = new CustomEvent('change', { detail: { value: this.value } });
    this.dispatchEvent(changeEvent);
  }

  onMouseUp() {
    this.dragging = false;
    this.shadow.removeEventListener('mousemove', this.onMouseMove);
    this.shadow.removeEventListener('mouseup', this.onMouseUp);
  }

  updateThumbPosition(left = null, top = null) {
    const thumb = this.shadow.querySelector('.thumb');
    if (left !== null) {
      thumb.style.left = `${left}px`;
    }
    if (top !== null) {
      thumb.style.top = `${top}px`;
    } else {
      const percentage = (this.value - this.min) / (this.max - this.min);
      const thumbLeft = percentage * this.shadow.clientWidth;
      thumb.style.left = `${thumbLeft}px`;
    }
  }

  static get observedAttributes() {
    return ['min', 'max', 'value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'min' || name === 'max' || name === 'value') {
      this[name] = parseFloat(newValue);
      this.updateThumbPosition();
    }
  }
}


document.addEventListener('DOMContentLoaded', customElements.define('wijit-form', WijitForm));

if (!customElements.get('wijit-range')) {
	document.addEventListener('DOMContentLoaded', customElements.define('wijit-range', WijitRange));
}


