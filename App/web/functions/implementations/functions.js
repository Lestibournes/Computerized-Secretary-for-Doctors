/**
 * Check if the text containst the exact search term anywhere
 * @param {string} text The text in which to search
 * @param {string} search The search term
 * @returns {number} 0 if the search term was not found in the text, 1 if the search term was found in the text.
 */
const stringContains = (text, search) => {
	let src = (String) (text);
	let term = (String) (search);

	for (let i = 0; i < src.length; i++) {
		if (src.substr(i, term.length).toLowerCase() === term.toLowerCase()) {
			return true;
		}
	}

	return false;
}

/**
 * Capitalize the first letter of every word in the given text.
 * @param {string} text 
 * @returns {string}
 */
function capitalizeAll(text) {
	const words = text.split(/\s+/);
	let result = "";

	for (const word of words) {
		result += " " + word[0].toUpperCase() + word.substr(1).toLowerCase();
	}

	return result;
}

exports.stringContains = stringContains;
exports.capitalizeAll = capitalizeAll;