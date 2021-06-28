export class Strings {
	#language;
	static #instance
	
	constructor() {
		console.log("In constructor");
		if (!Strings.#instance) {
			console.log("Creating new instance");
			this.#language = "he";
			Strings.#instance = this;
		}

		console.log("Returning instance");
		return Strings.#instance;
	}
	

	/**
	 * Set the UI language.
	 * Supported: English (en), Hebrew (he), Arabic (ar).
	 * @param {string} language 2 letter language code.
	 * @returns {boolean} true if the language code is supported. False otherwise.
	 */
	set language(language) {
		switch (language) {
			case "en":
				case "he":
			case "ar":
				this.#language = language;
				return true;
				
				default:
					return false;
				}
	}
	
	get language() {
		return this.#language;
	}

	/**
	 * Retrieve the requested string in the current UI language.
	 * @param {number} id The id of the requested string (an index)
	 * @param {Map} values the named variables to plug into the string
	 * @returns 
	 */
	getString(id, values) {
		let text = Strings.#strings[id].get(this.#language);

		if (values) {
			const matches =  text.match(/\w+/);
			
			for (const match of matches) {
				const pattern = new RegExp("\\$\\(" + match + "\\)");
				text = text.replace(pattern, values.get(match));
			}
		}
		
		return text;
	}

	/**
	 * The array holds one map per string.
	 * Each map maps the language code to that language's version of the string.
	 * @type {Map<string, string>[]}
	 */
	static #strings = [
		// Names of the days of the week. (0-6):
		new Map([
			["en", "Sunday"],
			["he", "ראשון"]
		]),
		new Map([
			["en", "Monday"],
			["he", "שני"]
		]),
		new Map([
			["en", "Tuesday"],
			["he", "שלישי"]
		]),
		new Map([
			["en", "Wednesday"],
			["he", "רביעי"]
		]),
		new Map([
			["en", "Thursday"],
			["he", "חמישי"]
		]),
		new Map([
			["en", "Friday"],
			["he", "שישי"]
		]),
		new Map([
			["en", "Saturday"],
			["he", "שבת"]
		]),

		// Abbreviated names of the days of the week. (7-13):
		new Map([
			["en", "Sun"],
			["he", "א"]
		]),
		new Map([
			["en", "Mon"],
			["he", "ב"]
		]),
		new Map([
			["en", "Tue"],
			["he", "ג"]
		]),
		new Map([
			["en", "Wed"],
			["he", "ד"]
		]),
		new Map([
			["en", "Thu"],
			["he", "ה"]
		]),
		new Map([
			["en", "Fri"],
			["he", "ו"]
		]),
		new Map([
			["en", "Sat"],
			["he", "ש"]
		]),

		// Names of the months. (14-25):
		new Map([
			["en", "January"],
			["he", "ינואר"]
		]),
		new Map([
			["en", "February"],
			["he", "פברואר"]
		]),
		new Map([
			["en", "March"],
			["he", "מרץ"]
		]),
		new Map([
			["en", "April"],
			["he", "אפריל"]
		]),
		new Map([
			["en", "May"],
			["he", "מאי"]
		]),
		new Map([
			["en", "June"],
			["he", "יוני"]
		]),
		new Map([
			["en", "July"],
			["he", "יולי"]
		]),
		new Map([
			["en", "August"],
			["he", "אוגוסט"]
		]),
		new Map([
			["en", "September"],
			["he", "ספטמבר"]
		]),
		new Map([
			["en", "October"],
			["he", "אוקטובר"]
		]),
		new Map([
			["en", "November"],
			["he", "נובמבר"]
		]),
		new Map([
			["en", "December"],
			["he", "דצמבר"]
		]),
	]
}
