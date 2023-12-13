export default class SlidingDoors extends HTMLElement {
	#active = false;
	#speed = '.5s';
	#theme = 'auto';
	container;
	themes = {
		default: {
			tintOuter: 'dimgray',
			tintMiddle: 'lightgray 40%',
			tintInner: 'white 90%'
		},
		light: {
			tintOuter: 'rgb(220,220,220)',
			tintMiddle: 'rgb(250,250,250) 40%',
			tintInner: 'white 90%'
		},
		dark: {
			tintOuter: 'rgb(40,40,40)',
			tintMiddle: 'rgb(70,70,70) 40%',
			tintInner: 'dimgray 90%'
		},
		auto: {}
	};
	wrapper;
	static observedAttributes = ['active', 'speed', 'theme'];

	constructor() {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					border-radius: inherit;
					display: inline-block;
					opacity: 0;
					overflow: hidden;
					--speed: ${this.speed};
					--tintOuter: ${this.themes.default.tintOuter};
					--tintMiddle: ${this.themes.default.tintMiddle};
					--tintInner: ${this.themes.default.tintInner};
					transition: all .5s;
				}

				::slotted(*) {
					height: 100%;
				}

				@keyframes close {
					100% { z-index: 1; }
				}

				@keyframes open {
					100% { z-index: -1 }
				}

				@layer container {
					#container {
						height: 100%;
						position: relative;
					}

					#container::before,
					#container::after {
						border-width: 1px;
						border-style: solid;
						border-color: silver;
						content: '';
						position: absolute;
						bottom: 0;
						top: 0;
						z-index: 1;
					}

					#container.shadow::before,
					#container.shadow::after {
						box-shadow: 5px 5px 10px rgb(40,40,40);
					}

					#container.shadow::before {
						border-width: 1px 0 1px 1px;
					}

					#container.shadow::after {
						border-width: 1px 1px 1px 0;
					}

					#container::before {
						background-color: var(--tintOuter);
						background-image: linear-gradient(
							to right,
							var(--tintOuter),
							var(--tintMiddle),
							var(--tintInner)
						);
						border-width: 0;
						left: 0;
						right: 100%;
						transition: right var(--speed) ease-in;
					}

					#container::after {
						background-image: linear-gradient(
							to left,
							var(--tintOuter),
							var(--tintMiddle),
							var(--tintInner)
						);
						border-width: 0;
						left: 100%;
						right: 0;
						transition: left var(--speed) ease-in;
					}
				} /* @container */


				@layer effect {
					#effectLeft,
					#effectRight {
						aspect-ratio: 1/1;
						display: flex;
						flex-direction: column;
						justify-content: center;
						content: '';
						position: absolute;
						top: 50%;
						transition: all var(--speed) ease-in;
						z-index: 1;
					}

					#effectLeft {
						left: 0;
						right: 100%;
						transform: translateY(-50%) translateX(50%);
						-webkit-mask-image: linear-gradient( to right, white 50%, transparent 51% );
						mask-image: linear-gradient( to right, white 50%, transparent 51% );
					}

					#effectRight {
						left: 100%;
						right: 0;
						transform: translateY(-50%) translateX(-50%);
						-webkit-mask-image: linear-gradient( to left, white 50%, transparent 50% );
						mask-image: linear-gradient( to left, white 50%, transparent 50% );
					}
				} /* @effect */

				@layer wrapper {
					#wrapper {
						height: 100%;
						position: relative;
					}

					#wrapper.active #effectLeft,
					#wrapper.active #container::before {
						right: 50%;
					}

					#wrapper.active #effectRight,
					#wrapper.active #container::after {
						left: 50%;
					}
				} /* @wrapper */

				#scrollable {
					overflow: auto;
					padding-right: 16px;
				}

			</style>
			<div id="wrapper" part="wrapper">
				<div id="container" part="container">
					<div id="scrollable">
						<slot></slot>
					</div>
				</div>
				<div id="effectLeft"><slot name="effectLeft"></slot></div>
				<div id="effectRight"><slot name="effectRight"></slot></div>
			</div>
		`;

		this.wrapper = this.shadowRoot.querySelector('#wrapper');
		this.container = this.shadowRoot.querySelector('#container');
	}

	attributeChangedCallback(attr, oldval, newval) {
		this[attr] = newval;
	}

	connectedCallback() {
		const elem = this.querySelector('*[slot=effect]');
		this.setEffect(elem);
		this.style.opacity = '1';

		if (this.active) this.container.classList.add('shadow');

		this.container.addEventListener('transitionstart', () => {
			if (this.active) this.container.classList.add('shadow');
		});

		this.container.addEventListener('transitionend', () => {
			if (!this.active) this.container.classList.remove('shadow');
		});
	}

	setEffect(elem) {
		if (!elem) return;
		const clone = elem.cloneNode(true);
		elem.setAttribute('slot', 'effectLeft');
		clone.setAttribute('slot', 'effectRight');
		this.append(clone);
	}

	get active () { return this.#active; }
	set active (value) {
		switch (value) {
		case '':
		case 'true':
			value = true;
			this.wrapper.classList.add('active');
			break;
		default:
			value = false;
			this.wrapper.classList.remove('active');
			break;
		}

		this.#active = value;
	}

	get speed () { return this.#speed; }
	set speed (value) {
		// if value is just a number, add 's' for 'seconds';
		if (!isNaN (value)) value = value + 's';
		this.#speed = value;
		this.style.setProperty('--speed', value);
	}

	get theme () { return this.#theme; }
	set theme (value) {
		switch (value) {
		case 'auto':
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				value = 'dark';
			} else {
				value = 'light';
			}
			break;
		case 'light':
		case 'dark':
			break;
		default:
			value = 'default';
			break;
		}

		this.#theme = value;
		const theme = this.themes[value];
		if (theme) {
			this.tintOuter = theme.tintOuter;
			this.tintMiddle = theme.tintMiddle;
			this.tintInner = theme.tintInner;
			this.style.setProperty('--tintOuter', theme.tintOuter);
			this.style.setProperty('--tintMiddle', theme.tintMiddle);
			this.style.setProperty('--tintInner', theme.tintInner);
		}
	}
}

document.addEventListener('DOMContentLoaded', customElements.define('sliding-doors', SlidingDoors));
