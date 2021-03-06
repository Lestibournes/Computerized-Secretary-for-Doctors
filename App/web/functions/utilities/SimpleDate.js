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
	 * Display names for the months.
	 */
	static month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	/**
	 * Convert a Date object to a SimpleDate object.
	 * Date object days of month start at 1.
	 * Day 0 of each month is the last day of the previous month.
	 * @param {Date} date 
	 * @returns {SimpleDate}
	 * @deprecated
	 */
	static fromDate(date) {
		return new SimpleDate(date);
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

	/**
	 * Convert this SimpleDate object into a Date object.
	 * @returns {Date}
	 */
	toDate() {
		return new Date(this.#date);
	}

	/**
	 * @type {Date}
	 * @private
	 */
	#date;
	
	/**
	 * 
	 * A wrapper for the native Date object to make it easier to deal with.
	 * Will construct a new SimpleDate using the specified date values.
	 * @constructor
	 * @param {number} year Can be any value. 
	 * @param {number} month valid values: 0...11
	 * @param {number} day valid values: 1...31 (depends on the month).
	 *//**
	 * A wrapper for the native Date object to make it easier to deal with.
	 * Will construct a new date object using the provided date.
	 * @constructor
	 * @param {Date} date A date object
	 *//**
	 * A wrapper for the native Date object to make it easier to deal with.
	 * Will construct a new date object using the current date.
	 * @constructor
	 */
	constructor(...args) {
		if (args.length === 3 || args.length === 2) this.#date = new Date(...args);
		if (args.length === 1) this.#date = new Date(args[0].getFullYear(), args[0].getMonth(), args[0].getDate());
		if (args.length === 0) this.#date = new Date();
	}

	/**
	 * @returns {number} The year. Can be any value.
	 */
	get year() {
		return this.#date.getFullYear();
	}

	/**
	 * @returns {number} The month. Values 0...11.
	 */
	get month() {
		return this.#date.getMonth();
	}

	/**
	 * @returns {number} The day of the month. Values 0...30 and null.
	 */
	get day() {
		return this.#date.getDate();
	}

	/**
	 * @returns {number} The day of the week. Values 0...6.
	 */
	get weekday() {
		return this.#date.getDay();
	}

	/**
	 * @returns {string} The name of the day of the week, in lowercase.
	 */
	get dayname() {
		return SimpleDate.day_names[this.weekday];
	}

	/**
	 * @returns {string} The name of the day of the week, in lowercase.
	 */
	get monthname() {
		return SimpleDate.month_names[this.month];
	}


	/**
	 * Get the next year on the calendar.
	 * @returns {SimpleDate} A new date representing the next year on the calendar.
	 */
	getNextYear() {
		return new SimpleDate(this.year + 1, this.month, this.day);
	}

	/**
	 * Get the next month on the calendar.
	 * @returns {SimpleDate} A new date representing the next month on the calendar.
	 */
	getNextMonth() {
		const next = new SimpleDate(this.year, this.month + 1, 1);

		if (next.getDaysInMonth() < this.day) {
			return next.getLastDayInMonth();
		}

		return new SimpleDate(this.year, this.month + 1, this.day);
	}

	/**
	 * Get the next week on the calendar.
	 * @returns {SimpleDate} A new date representing the next week on the calendar.
	 */
	 getNextWeek() {
		return new SimpleDate(this.year, this.month, this.day + 7);
	}

	/**
	 * Get the next day on the calendar.
	 * @returns {SimpleDate} A new date representing the next day on the calendar.
	 */
	getNextDay() {
		return new SimpleDate(this.year, this.month, this.day + 1);
	}

	/**
	 * Get the previous year on the calendar.
	 * @returns {SimpleDate} A new date representing the previous year on the calendar.
	 */
	getPreviousYear() {
		return new SimpleDate(this.year - 1, this.month, this.day);
	}

	/**
	 * Get the previous month on the calendar.
	 * @returns {SimpleDate} A new date representing the previous month on the calendar.
	 */
	getPreviousMonth() {
		const previous = new SimpleDate(this.year, this.month - 1, 1);

		if (previous.getDaysInMonth() < this.day) {
			return previous.getLastDayInMonth();
		}

		return new SimpleDate(this.year, this.month - 1, this.day);
	}

	/**
	 * Get the previous week on the calendar.
	 * @returns {SimpleDate} A new date representing the previous week on the calendar.
	 */
	 getPreviousWeek() {
		return new SimpleDate(this.year, this.month, this.day - 7);
	}

	/**
	 * Get the previous day on the calendar.
	 * @returns {SimpleDate} A new date representing the previous day on the calendar.
	 */
	getPreviousDay() {
		return new SimpleDate(this.year, this.month, this.day - 1);
	}

	/**
	 * 
	 * @returns The number of days in the current month.
	 */
	getDaysInMonth() {
		return new Date(this.year, this.month + 1, 0).getDate();
	}

	/**
	 * Get the first day of the current month.
	 * @returns {SimpleDate}
	 */
	getFirstDayOfTheMonth() {
		return new SimpleDate(new Date(this.year, this.month, 1));
	}

	/**
	 * Get the last day of the current month.
	 * @returns {SimpleDate}
	 */
	 getLastDayInMonth() {
		return new SimpleDate(new Date(this.year, this.month + 1, 0));
	}

	/**
	 * Get the date of Sunday for the current week.
	 * @returns {SimpleDate}
	 */
	getSunday() {
		return new SimpleDate(new Date(this.year, this.month, this.day - this.weekday));
	}

	/**
	 * Get the date of Saturday for the current week.
	 * @returns {SimpleDate}
	 */
	 getSaturday() {
		return new SimpleDate(new Date(this.year, this.month, this.day + 6 - this.weekday));
	}
	
	/**
	 * Compares the current date to the specified time.
	 * @param {SimpleDate} that Another date
	 * @returns {number} 1 if this > that, 0 if this == that, -1 if this < that.
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