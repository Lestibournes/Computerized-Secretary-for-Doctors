/**
 * Represents an time in terms of hours and minutes.
 * Is supposed to be immutable.
 */
class Time {
	/**
	 * Convert a Date object to a Time object.
	 * @param {Date} date 
	 * @returns {Time}
	 */
	static fromDate(date) {
		return new Time(date.getUTCHours(), date.getUTCMinutes());
	}

	/**
	 * Convert a simple object into a Time object.
	 * @param {{hours: number, minutes: number}} time 
	 * @returns {Time}
	 */
	static fromObject(time) {
		return new Time(time.hours, time.minutes);
	}

	toTimestamp() {
		return new Date(2021, 0, 0, this.hours, this.minutes).getTime();
	}

	toDate() {
		return new Date(2021, 0, 0, this.hours, this.minutes);
	}

	hours;
	minutes;

	/**
	 * Creates a new Time object with the specified number of hours and minutes.
	 * Only meant for use with non-negative values.
	 * @param {number} hours The number of hours.
	 * @param {number} minutes Then number of minutes.
	 */
	constructor(...args) {
		if (args.length === 2) {
			this.hours = args[0];
			this.minutes = args[1];
		}
		if (args.length === 0) {
			const now = new Date();
			this.hours = now.getHours();
			this.minutes = now.getMinutes();
		}
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

exports.Time = Time;