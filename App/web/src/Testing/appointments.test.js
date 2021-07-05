const firebase = require('@firebase/testing');

const { projectId, thisAuth, thisClinicData, otherClinicData, getFirestore, getAdminFirestore, thisUserData, otherAuth, otherUserData, thisShiftData, otherShiftData, thisTypesData, otherTypesData } = require('./shared');

const appointments = require('../../functions/implementations/appointments');

const { Slot } = require('../../functions/utilities/Slot');
const { Time } = require('../../functions/utilities/Time');
const { globals } = require('../../functions');
const { SimpleDate } = require('../../functions/utilities/SimpleDate');

async function popuplateDatabase() {
	// Create the clinic:
	const thisClinicID = (await getAdminFirestore().collection("clinics").add(thisClinicData)).id;
	const otherClinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;

	// Setting up this doctor with his shifts in both clinics:
	const thisUserRef = getAdminFirestore().collection("users").doc(thisAuth.uid);
	await thisUserRef.set(thisUserData);
	await thisUserRef.update({doctor: true});

	await getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).set({
		user: thisAuth.uid,
		clinic: thisClinicID,
		minimum: 15
	});

	await getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(thisAuth.uid).set({
		user: thisAuth.uid,
		clinic: otherClinicID,
		minimum: 15
	});

	const thisTypesRef1 = getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).collection("types");
	const thisTypesRef2 = getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(thisAuth.uid).collection("types");

	for (const TypeData of thisTypesData) {
		thisTypesRef1.add(TypeData);
		thisTypesRef2.add(TypeData);
	}

	for (const typeData of otherTypesData) {
		thisTypesRef1.add(typeData);
		thisTypesRef2.add(typeData);
	}

	const thisShiftsRef1 = getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).collection("shifts");
	const thisShiftsRef2 = getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(thisAuth.uid).collection("shifts");

	for (const shiftData of thisShiftData) {
		thisShiftsRef1.add(shiftData);
		thisShiftsRef2.add(shiftData);
	}

	for (const shiftData of otherShiftData) {
		thisShiftsRef1.add(shiftData);
		thisShiftsRef2.add(shiftData);
	}

	// Setting up the doctor with his shifts in both clinics:
	const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
	await otherUserRef.set(otherUserData);
	await otherUserRef.update({doctor: true});

	await getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(otherAuth.uid).set({
		user: otherAuth.uid,
		clinic: thisClinicID,
		minimum: 15
	});

	await getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).set({
		user: otherAuth.uid,
		clinic: otherClinicID,
		minimum: 15
	});

	const otherTypesRef1 = getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(otherAuth.uid).collection("types");
	const otherTypesRef2 = getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).collection("types");

	for (const typeData of thisTypesData) {
		otherTypesRef1.add(typeData);
		otherTypesRef2.add(typeData);
	}

	for (const typeData of otherTypesData) {
		otherTypesRef1.add(typeData);
		otherTypesRef2.add(typeData);
	}

	const otherShiftsRef1 = getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(otherAuth.uid).collection("shifts");
	const otherShiftsRef2 = getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).collection("shifts");

	for (const shiftData of thisShiftData) {
		otherShiftsRef1.add(shiftData);
		otherShiftsRef2.add(shiftData);
	}

	for (const shiftData of otherShiftData) {
		otherShiftsRef1.add(shiftData);
		otherShiftsRef2.add(shiftData);
	}
}

// /**
//  * Iterate over all combinations of clinic, doctor, appointment type, and shift.
//  * @param {(
//  * clinicSnap: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>,
//  * doctorSnap: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>,
//  * typeSnap: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>,
//  * shiftSnap: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>
//  * ) => {}} callback 
//  */
// async function iterateAllTypes(callback) {
// 	const clinicSnaps = await getFirestore(thisAuth).collection("clinics").get();

// 	for (const clinicSnap of clinicSnaps.docs) {
// 		const doctorSnaps = await clinicSnap.ref.collection("doctors").get();

// 		for (const doctorSnap of doctorSnaps.docs) {
// 			const typeSnaps = await doctorSnap.ref.collection("types").get();
// 			const shiftSnaps = await doctorSnap.ref.collection("shifts").get();
			
// 			for (const typeSnap of typeSnaps.docs) {
// 				await callback(clinicSnap, doctorSnap, typeSnap, shiftSnaps);
// 			}
// 		}
// 	}
// }

// Clear all the data before each test to make sure that each test happens in isolation:
beforeEach(async () => {
	getAdminFirestore();
	await firebase.clearFirestoreData({projectId: projectId});
});

// Clear all the data after the last test to make sure no crud is left over:
// afterAll(() => {
// 	return firebase.clearFirestoreData({projectId: projectId});
// });

describe("Appointment Functions", () => {
	beforeEach(async () => {
		await popuplateDatabase();
	});

	// test("Available time slots", async () => {
	// 	const date = new SimpleDate(2021, 9, 8);

	// 	const env = {
	// 		admin: firebase.initializeAdminApp({projectId: projectId})
	// 	}

	// 	await iterateAllTypes(async (clinicSnap, doctorSnap, typeSnap, shiftSnaps) => {
	// 		const duration = typeSnap.data().duration * doctorSnap.data().minimum;

	// 		const params = {
	// 			clinic: clinicSnap.id,
	// 			doctor: doctorSnap.id,
	// 			date: date.toObject(),
	// 			type: typeSnap.data().name
	// 		}

	// 		const available = await appointments.getAvailable(env, globals, params);

	// 		for (const shiftSnap of shiftSnaps.docs) {
	// 			if (shiftSnap.data().day === date.weekday) {
	// 				const shiftSlot = new Slot(
	// 					Time.fromObject(shiftSnap.data().start),
	// 					Time.fromObject(shiftSnap.data().end)
	// 				);

	// 				let currentSlot = new Slot(shiftSlot.start, shiftSlot.start.incrementMinutes(duration));

	// 				while (shiftSlot.contains(currentSlot)) {
	// 					let exists = false;

	// 					for (const slot of available) {
	// 						if (slot.start.compare(currentSlot.start) === 0) {
	// 							exists = true;
	// 							break;
	// 						}
	// 					}

	// 					expect(exists).toBe(true);

	// 					currentSlot = new Slot(currentSlot.start.incrementMinutes(duration), currentSlot.end.incrementMinutes(duration));
	// 				}
	// 			}
	// 		}

	// 	});
	// });

	test("List available time slots", async () => {
		const date = new SimpleDate(2021, 9, 8);

		// Fetch all the shifts of all the doctors in all the clinics:
		const clinicSnaps = await getFirestore(thisAuth).collection("clinics").get();

		for (const clinicSnap of clinicSnaps.docs) {
			const doctorSnaps = await clinicSnap.ref.collection("doctors").get();

			for (const doctorSnap of doctorSnaps.docs) {
				const typeSnaps = await doctorSnap.ref.collection("types").get();
				const shiftSnaps = await doctorSnap.ref.collection("shifts").get();
				
				for (const typeSnap of typeSnaps.docs) {
					const duration = typeSnap.data().duration * doctorSnap.data().minimum;

					const env = {
						admin: firebase.initializeAdminApp({projectId: projectId})
					}

					const params = {
						clinic: clinicSnap.id,
						doctor: doctorSnap.id,
						date: date.toObject(),
						type: typeSnap.data().name
					}

					const available = await appointments.getAvailable(env, globals, params);

					for (const shiftSnap of shiftSnaps.docs) {
						if (shiftSnap.data().day === date.weekday) {
							const shiftSlot = new Slot(
								Time.fromObject(shiftSnap.data().start),
								Time.fromObject(shiftSnap.data().end)
							);
	
							let currentSlot = new Slot(shiftSlot.start, shiftSlot.start.incrementMinutes(duration));
	
							while (shiftSlot.contains(currentSlot)) {
								let exists = false;
	
								for (const slot of available) {
									if (slot.start.compare(currentSlot.start) === 0) {
										exists = true;
										break;
									}
								}
	
								expect(exists).toBe(true);
	
								currentSlot = new Slot(currentSlot.start.incrementMinutes(duration), currentSlot.end.incrementMinutes(duration));
							}
						}
					}
				}
			}
		}
	});
});