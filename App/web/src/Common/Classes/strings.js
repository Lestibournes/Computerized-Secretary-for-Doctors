import ReactHtmlParser from 'react-html-parser';
import { auth, db, debug } from '../../init';

export class Strings {
	#language;
	static #instance;

	/**
	 * @type {Map<string, string>[]}
	 */
	static #strings;
	
	constructor() {
		if (!Strings.#instance) {
			// Get the user's language setting:
			auth.onAuthStateChanged(
				state => {
					if (state) {
						return db.collection("users").doc(state.uid).onSnapshot(
							user_snap => {if (user_snap.exists && user_snap.data().language) this.language = user_snap.data().language}
						);
					}
				}
			)

			// Fetch language strings:
			const strings = require("./strings.json").strings;
			Strings.#strings = [];

			for (const entry of strings) {
				const entries = new Map();

				if (entry?.en) entries.set("en", entry.en);
				if (entry?.he) entries.set("he", entry.he);
				if (entry?.ar) entries.set("ar", entry.ar);

				Strings.#strings.push(entries);
			}

			// Print the strings cheat sheet:
			if (debug) {
				for (let i = 0; i < Strings.#strings.length; i++) {
					console.log(
						i + 
						(Strings.#strings[i].has("en") ? "\t" + Strings.#strings[i].get("en") : "") + 
						(Strings.#strings[i].has("he") ? "\t" + Strings.#strings[i].get("he") : "") + 
						(Strings.#strings[i].has("ar") ? "\t" + Strings.#strings[i].get("ar") : "")
						);
				}
			}

			// Set default language:
			this.#language = "he";

			// Set the singleton instance:
			Strings.#instance = this;
		}

		// Return the singleton instance:
		return Strings.#instance;
	}
	
	static get instance() {
		return new Strings();
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

	get direction() {
		if (this.language === "en") return "ltr";
		else return "rtl";
	}

	/**
	 * Retrieve the requested string in the current UI language.
	 * @param {number} id The id of the requested string (an index)
	 * @param {Map} values the named variables to plug into the string
	 */
	get(id, values, language = this.language) {
		if (id < Strings.#strings.length) {
			let text = Strings.#strings[id].get(language);
	
			if (values) {
				for (const key of values.keys()) {
					const pattern = new RegExp("\\$\\(" + key + "\\)");
					text = text.replace(pattern, values.get(key));
				}

				return ReactHtmlParser(text);
			}

			
			return text;
		}

		return null;
	}
}
