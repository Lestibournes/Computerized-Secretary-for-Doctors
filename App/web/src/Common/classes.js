/**
 * Represents an time in terms of hours and minutes.
 * Is supposed to be immutable.
 */
export class Time {	/**
	* Convert a simple object into a Time object.
	* @param {{hours: number, minutes: number}} time 
	* @returns {Time}
	*/
	static fromObject(time) {
		return new Time(time.hours, time.minutes);
	}
	
	toObject() {
		return {hours: this.hours, minutes: this.minutes};
	}

	#hours;
	#minutes;

	/**
	 * Creates a new Time object with the specified number of hours and minutes.
	 * Only meant for use with non-negative values.
	 * @param {number} hours The number of hours.
	 * @param {number} minutes Then number of minutes.
	 */
	constructor(hours, minutes) {
		this.#hours = hours;
		this.#minutes = minutes;
	}

	/**
	 * @returns {number} The number of hours.
	 */
	get hours() {
		return this.#hours;
	}

	/**
	 * @returns {number} The number of minutes.
	 */
	get minutes() {
		return this.#minutes;
	}

	/**
	 * Returns a new instance of Time where the number of minutes has been incremented by the specified value.
	 * The number of minutes will be restricted to a maximum of 59 and will carry over to the the number of hours.
	 * The number of hours will be restricted to a maximum of 23 and will simply reset to 0 if it overflows.
	 * Meant for use with non-zero values only.
	 * @param {number} minutes The number of minutes by which to increment the time relative to the current time.
	 * Should be a non-negative value.
	 * @returns {Time} A new instance of Time where the values have been incremented by the specified number of
	 * minutes relative to the current time.
	 */
	incrementMinutes(minutes) {
		let tmp_minutes = this.#minutes;
		let tmp_hours = this.#hours;

		tmp_minutes += minutes;
		tmp_hours += Math.floor(tmp_minutes / 60);
		tmp_hours %= 24;
		tmp_minutes %= 60;

		return new Time(tmp_hours, tmp_minutes);
	}

	/**
	 * Compares the current time to the specified time.
	 * @param {Time} that Another point in time
	 * @returns {number} 1 if this > that, 0 if this == that, -1 if this < that.
	 */
	compare(that) {
		if (this.hours > that.hours || (this.hours === that.hours && this.minutes > that.minutes)) return 1;
		else if (this.hours === that.hours && this.minutes === that.minutes) return 0;
		else return -1;
	};

	toString() {
		return (this.hours < 10 ? "0" : "") + this.hours + ":" + (this.minutes < 10 ? "0" : "") + this.minutes;
	}
}

/**
 * Represent a segment of time.
 */
export class Slot {
	#start;
	#end;
	
	/**
	 * Create a new time slot with the specified start and end times.
	 * @param {Time} start The beginning of the time slot. Should be a value smaller than end.
	 * @param {Time} end The end of the time slot. Should be a value greater than start.
	 */
	constructor(start, end) {
		this.#start = start;
		this.#end = end;
	}

	/**
	 * @returns {Time} the start time of this time slot.
	 */
	get start() {
		return this.#start;
	}

	/**
	 * @returns {Time} the end time of this time slot.
	 */
	get end() {
		return this.#end;
	}

	/**
	 * Check if this time slot collides with that time slot.
	 * @param {Slot} that Another time slot.
	 * @returns {boolean} true if there is a collision, false if there isn't.
	 */
	collides(that) {
		return (
			((this.#start.compare(that.#start) >= 0 && this.#start.compare(that.#end) < 0) ||
			 (this.#end.compare(that.#start) >= 0 && this.#end(that.#end) < 0))
		);
	}
}
/**
 * A simple and immutable representation of a calendar date.
 */
 export class SimpleDate {
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
		if (args.length === 1) this.#date = args[0];
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