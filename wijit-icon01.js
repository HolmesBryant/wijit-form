export default class WijitIcon01 extends HTMLElement {
	#animate = false;
	#color = 'black';
	static observedAttributes = ['animate', 'color'];

	constructor() {
		super();
		this.attachShadow({mode:'open'});
		this.shadowRoot.innerHTML = `
		<style>
			:host {
				--color: ${this.color};
				display: block;
				height: 100%;
			}

	        @keyframes rotate {
	            0% { transform: rotate(0deg); }
	            100% { transform: rotate(360deg); }
	        }

	        svg {
	        	max-height: 100%;
	        	max-width: 100%;
	        }

	        svg.animate { animation: rotate 1.5s infinite linear; }
	        svg circle, svg line { stroke: var(--color); }

	        #wrapper {
				height: 100%;
				text-align: center;
			}

	        #content {
	        	align-items: center;
	        	display: flex;
	        	justify-content: center;
	        	height: 100%;
	        	position: absolute;
	        	top: 0;
	        	left: 0;
	        	width: 100%;
	        }
    	</style>

    	<div id="wrapper">
	        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
	            <circle cx="12" cy="12" r="10" stroke-width="3" fill="none" />
	            <line x1="12" y1="2" x2="12" y2="6" stroke-width="3" />
	            <line x1="12" y1="18" x2="12" y2="22" stroke-width="3" />
	            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" stroke-width="3" />
	            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" stroke-width="3" />
	        </svg>
	        <div id="content">
		        <slot></slot>
	        </div>
        </div>
		`;

		this.icon = this.shadowRoot.querySelector('svg');
	}

	connectedCallback() {
	}

	attributeChangedCallback(attr, oldval, newval) {
		this[attr] = newval;
	}

	get animate () { return this.#animate; }
	set animate (value) {
		switch (value) {
		case '':
		case 'true':
			value = true;
			this.icon.classList.add('animate');
			break;
		default:
			value = false;
			this.icon.classList.remove('animate');
		}

		this.#animate = value;
	}

	get color () { return this.#color;}
	set color (value) {
		this.#color = value;
		this.style.setProperty('--color', value);
	}
}

document.addEventListener('DOMContentLoaded', customElements.define('wijit-icon01', WijitIcon01));
