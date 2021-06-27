// const strings = [
// 	{
// 		en: "Hello, $(name)",
// 		he: "שלום, $(name)"
// 	},
// 	{
// 		en: "Wellcome, $(name)",
// 		he: "ברוך הבא, $(name)"
// 	}
// ]

const strings = [
	new Map([
		["en", "Hello, $(name)"],
		["he", "שלום, $(name)"]
	]),
	new Map([
		["en", "Wellcome, $(name)"],
		["he", "ברוך הבא, $(name)"]
	])
]

/**
 * 
 * @param {number} id The id of the requested string (an index)
 * @param {string} lang the language code. Supported: en, he, and in the future: ar
 * @param {Map} values the named variables to plug into the string
 * @returns 
 */
export function getString(id, lang, values) {
	let text = strings[id].get(lang);
	const matches =  text.match(/\w+/);

	for (const match of matches) {
		const pattern = new RegExp("\\$\\(" + match + "\\)");
		text = text.replace(pattern, values.get(match));
	}

	return text;
}