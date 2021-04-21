
/**
 * A simple and immutable representation of a calendar date.
 */
class SimpleDate {

	/**
	 * The names of the days of the week as used in the database, for easy conversion between how
	 * it's stored in the database and how it's represented by the JS Date object.
	 */
	static day_names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

	
	/**
	 * Convert a Date object to a SimpleDate object.
	 * @param {Date} date 
	 * @returns {SimpleDate}
	 */
	 static fromDate(date) {
		return new SimpleDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
	}

	/**
	 * Take a simple object representation of a date and return a SimpleDate.
	 * @param {{year: number, month: number, day: number}} object 
	 * @returns {SimpleDate}
	 */
	static fromObject(object) {
		return new SimpleDate(object.year, object.month, object.day);
	}

	/**
	 * Convert this SimpleDate object into a simple object.
	 * @returns {{year: number, month: number, day: number}}
	 */
	toObject() {
		return {
			year: this.year,
			month: this.month,
			day: this.day
		};
	}
	
	year;
	month;
	day;
	
	/**
	 * Create a new SimpleDate object.
	 * @param {number} year Can be any value. 
	 * @param {number} month valid values: 0...11
	 * @param {number} day valid values: 0...31 (depends on the month) and null.
	 */
	constructor(year, month, day) {
		this.year = year;
		this.month = month;
		this.day = day;
	}

	/**
	 * @returns {number} The year. Can be any value.
	 */
	get year() {
		return this.year;
	}

	/**
	 * @returns {number} The month. Values 0...11.
	 */
	get month() {
		return this.month;
	}

	/**
	 * @returns {number} The day of the month. Values 0...31 and null.
	 */
	get day() {
		return this.day;
	}

	/**
	 * @returns {number} The day of the week. Values 0...6.
	 */
	get weekday() {
		return new Date(this.year, this.month, this.day).getDay();
	}

	/**
	 * @returns {string} The name of the day of the week, in lowercase.
	 */
	get dayname() {
		return SimpleDate.day_names[this.weekday];
	}

	/**
	 * Get the next month on the calendar.
	 * @returns {SimpleDate} A new date representing the next month on the calendar.
	 * @todo Take care of the day of the month too, in cases where its value is greater than the last day of the month.
	 */
	getNextMonth() {
		if (this.month === 11) {
			return new SimpleDate(this.year + 1, 0, this.day);
		}
		else {
			return new SimpleDate(this.year, this.month + 1, this.day);
		}
	}
	/**
	 * Get the previous month on the calendar.
	 * @returns {SimpleDate} A new date representing the previous month on the calendar.
	 * @todo Take care of the day of the month too, in cases where its value is greater than the last day of the month.
	 */
	getPreviousMonth() {
		if (this.month === 0) {
			return new SimpleDate(this.year - 1, 11, this.day);
		}
		else {
			return new SimpleDate(this.year, this.month - 1, this.day);
		}
	}

	/**
	 * Compares the current date to the specified time.
	 * @param {SimpleDate} that Another date
	 * @returns {number} 1 if this > that, 0 if this === that, -1 if this < that.
	 */
	compare(that) {
		if (this.year > that.year) return 1;
		if (this.year === that.year) {
			if (this.month > that.month) return 1;
			if (this.month === that.month) {
				if (this.day > that.day) return 1;
				if (this.day === that.day) return 0;
			}
		}

		return -1;
	}

	toString() {
		return (this.day < 10 ? "0" : "") + this.day + "/" + (this.month < 9 ? "0" : "") + (this.month + 1) + "/" + this.year;
	}
}

exports.SimpleDate = SimpleDate;