const { Time } = require("./Time");

/**
 * Represent a segment of time.
 */
 class Slot {
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
	 * @param {Slot} that Another time slot.
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
	 * @param {Slot} that Another time slot.
	 * @returns {boolean} True if it's completely contained. False if not.
	 */
	contains(that) {
		return this.start.compare(that.start) <= 0 && this.end.compare(that.end) >= 0;
	}
	
	toString() {
		return this.start.toString() + "-" + this.end.toString();
	}
}

exports.Slot = Slot;