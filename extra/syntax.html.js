/**
 * HTML syntax definition file for wijit-code web component
 *
 *  @author Holmes Bryant <https://github.com/HolmesBryant>
 *  @license GPL-3.0
 *
 */
export default {
	argument: null,
	keyword: null,
	number: /[+-]?\d+[\b\.\w]*/g,
	operator: /=/g,
	tag: /<\/?[\w-]+|(?<=[\w"])>/g,
	string: /["'`][^"'`]*["'`]/g,
	variable: /\$\s*{[^}]+}/g,
	function: /\w+\([^)]*\)/g,
	comment: /<!--([\s\S]*?)-->/g,
}

