
// Custom data types:

/**
 * Represents an time in terms of hours and minutes.
 * Is supposed to be immutable.
 */
class Time {
	hours;
	minutes;

	/**
	 * Creates a new Time object with the specified number of hours and minutes.
	 * Only meant for use with non-negative values.
	 * @param {number} hours The number of hours.
	 * @param {number} minutes Then number of minutes.
	 */
	constructor(hours, minutes) {
		this.hours = hours;
		this.minutes = minutes;
	}

	/**
	 * @returns {number} The number of hours.
	 */
	get hours() {
		return this.hours;
	}

	/**
	 * @returns {number} The number of minutes.
	 */
	get minutes() {
		return this.minutes;
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
		let tmp_minutes = this.minutes;
		let tmp_hours = this.hours;

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
		if (this.hours > that.hours || (this.hours == that.hours && this.minutes > that.minutes)) return 1;
		else if (this.hours == that.hours && this.minutes == that.minutes) return 0;
		else return -1;
	};

	toString() {
		return (this.hours < 10 ? "0" : "") + this.hours + ":" + (this.minutes < 10 ? "0" : "") + this.minutes;
	}
}

/**
 * Represent a segment of time.
 */
 class TimeRange {
	start;
	end;

	/**
	 * Create a new time slot with the specified start and end times.
	 * @param {Time} start The beginning of the time slot. Should be a value smaller than end.
	 * @param {Time} end The end of the time slot. Should be a value greater than start.
	 */
	constructor(start, end) {
		this.start = start;
		this.end = end;
	}

	/**
	 * @returns {Time} the start time of this time slot.
	 */
	get start() {
		return this.start;
	}

	/**
	 * @returns {Time} the end time of this time slot.
	 */
	get end() {
		return this.end;
	}

	/**
	 * Check if this time slot collides with that time slot.
	 * @param {TimeRange} that Another time slot.
	 * @returns {boolean} true if there is a collision, false if there isn't.
	 */
	collides(that) {
		return (
			((this.start.compare(that.start) >= 0 && this.start.compare(that.end) < 0) ||
			 (this.end.compare(that.start) > 0 && this.end.compare(that.end) <= 0))
		);
	}

	/**
	 * Check if this time slot contains that other time slot in its entirety.
	 * @param {TimeRange} that Another time slot.
	 * @returns {boolean} True if it's completely contained. False if not.
	 */
	contains(that) {
		return that.start.compare(this.start) >= 0 && that.end.compare(this.end) <= 0;
	}
	
	toString() {
		return this.start.toString() + "-" + this.end.toString();
	}
}

/**
 * A simple and immutable representation of a calendar date.
 */
 class SimpleDate {

	/**
	 * The names of the days of the week as used in the database, for easy conversion between how
	 * it's stored in the database and how it's represented by the JS Date object.
	 */
	static day_names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

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
		if (this.month == 11) {
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
		if (this.month == 0) {
			return new SimpleDate(this.year - 1, 11, this.day);
		}
		else {
			return new SimpleDate(this.year, this.month - 1, this.day);
		}
	}

	/**
	 * Compares the current date to the specified time.
	 * @param {SimpleDate} that Another date
	 * @returns {number} 1 if this > that, 0 if this == that, -1 if this < that.
	 */
	compare(that) {
		if (this.year > that.year) return 1;
		if (this.year == that.year) {
			if (this.month > that.month) return 1;
			if (this.month == that.month) {
				if (this.day > that.day) return 1;
				if (this.day == that.day) return 0;
			}
		}

		return -1;
	}

	toString() {
		return this.day + "/" + this.month + "/" + this.year;
	}
}

exports.Time = Time;
exports.TimeRange = TimeRange;
exports.SimpleDate = SimpleDate;