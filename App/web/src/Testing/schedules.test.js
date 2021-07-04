const firebase = require('@firebase/testing');
const { projectId, thisAuth, thisClinicData, otherClinicData, getFirestore, getAdminFirestore, thisUserData, otherAuth, otherUserData, thisShiftData, otherShiftData } = require('./shared');

async function popuplateShiftDatabase() {
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

	const thisScheduleRef1 = getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).collection("shifts");
	const thisScheduleRef2 = getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(thisAuth.uid).collection("shifts");

	for (const shiftData of thisShiftData) {
		thisScheduleRef1.add(shiftData);
		thisScheduleRef2.add(shiftData);
	}

	for (const shiftData of otherShiftData) {
		thisScheduleRef1.add(shiftData);
		thisScheduleRef2.add(shiftData);
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

	const otherScheduleRef1 = getAdminFirestore().collection("clinics").doc(thisClinicID).collection("doctors").doc(otherAuth.uid).collection("shifts");
	const otherScheduleRef2 = getAdminFirestore().collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).collection("shifts");

	for (const shiftData of thisShiftData) {
		otherScheduleRef1.add(shiftData);
		otherScheduleRef2.add(shiftData);
	}

	for (const shiftData of otherShiftData) {
		otherScheduleRef1.add(shiftData);
		otherScheduleRef2.add(shiftData);
	}
}

// Clear all the data before each test to make sure that each test happens in isolation:
beforeEach(() => {
	return firebase.clearFirestoreData({projectId: projectId});
});

// Clear all the data after the last test to make sure no crud is left over:
// afterAll(() => {
// 	return firebase.clearFirestoreData({projectId: projectId});
// });

describe("Creating shifts", () => {
	test("Create shift in the current user's clinic", async () => {
		// Setting up the test:

		// Create the clinic:
		const clinicRef = await getFirestore(thisAuth).collection("clinics").add(thisClinicData);
		
		// Setting up this doctor:
		const thisUserRef = getFirestore(thisAuth).collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});

		await clinicRef.collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicRef.id,
			minimum: 15
		});

		const thisScheduleRef = clinicRef.collection("doctors").doc(thisAuth.uid).collection("shifts");

		// Setting up the other doctor:
		const otherUserRef = getAdminFirestore().collection("users").doc(otherAuth.uid);
		await otherUserRef.set(otherUserData);
		await otherUserRef.update({doctor: true});

		await clinicRef.collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicRef.id,
			minimum: 15
		});

		const otherScheduleRef = clinicRef.collection("doctors").doc(otherAuth.uid).collection("shifts");
	
		// Performing the test:
		for (const shiftData of thisShiftData) {
			expect(await firebase.assertSucceeds(thisScheduleRef.add(shiftData)));
			expect(await firebase.assertSucceeds(otherScheduleRef.add(shiftData)));
		}

		for (const shiftData of otherShiftData) {
			expect(await firebase.assertSucceeds(thisScheduleRef.add(shiftData)));
			expect(await firebase.assertSucceeds(otherScheduleRef.add(shiftData)));
		}
	})

	test("Create a shift for another doctor in another user's clinic", async () => {
		// Setting up the test:

		// Set up the clinic:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;

		// Set up the doctor:
		await getAdminFirestore().collection("users").doc(otherAuth.uid).set(otherUserData);
		await getAdminFirestore().collection("users").doc(otherAuth.uid).update({doctor: true});

		await getAdminFirestore().collection("clinics").doc(clinicID).collection("doctors").doc(otherAuth.uid).set({
			user: otherAuth.uid,
			clinic: clinicID,
			minimum: 15
		});

		// Get a reference to the other doctor's shift as the current user:
		const scheduleRef = getFirestore(thisAuth).collection("clinics").doc(clinicID).collection("doctors").doc(otherAuth.uid).collection("shifts");
	
		// Performing the test:
		for (const shiftData of thisShiftData) {
			expect(await firebase.assertFails(scheduleRef.add(shiftData)));
		}

		for (const shiftData of otherShiftData) {
			expect(await firebase.assertFails(scheduleRef.add(shiftData)));
		}
	})

	test("Create a shift for the current user in another user's clinic", async () => {
		// Setting up the test:

		// Create the clinic:
		const clinicID = (await getAdminFirestore().collection("clinics").add(otherClinicData)).id;
	
		// Setting up the doctor:
		const thisUserRef = getAdminFirestore().collection("users").doc(thisAuth.uid);
		await thisUserRef.set(thisUserData);
		await thisUserRef.update({doctor: true});

		await getAdminFirestore().collection("clinics").doc(clinicID).collection("doctors").doc(thisAuth.uid).set({
			user: thisAuth.uid,
			clinic: clinicID,
			minimum: 15
		});

		const thisScheduleRef = getFirestore(thisAuth).collection("clinics").doc(clinicID).collection("doctors").doc(thisAuth.uid).collection("shifts");
	
		// Performing the test:
		for (const shiftData of thisShiftData) {
			expect(await firebase.assertSucceeds(thisScheduleRef.add(shiftData)));
		}

		for (const shiftData of otherShiftData) {
			expect(await firebase.assertSucceeds(thisScheduleRef.add(shiftData)));
		}
	});
});

describe("Reading, updating, and deleting shifts", () => {
	beforeEach(async () => {
		await popuplateShiftDatabase();
	});
	
	test("Read all the shifts", async () => {
		// Fetch all the shifts of all the doctors in all the clinics:
		const clinicSnaps = await getFirestore(thisAuth).collection("clinics").get();

		for (const clinicSnap of clinicSnaps.docs) {
			const doctorSnaps = await clinicSnap.ref.collection("doctors").get();

			for (const doctorSnap of doctorSnaps.docs) {
				expect(await firebase.assertSucceeds(doctorSnap.ref.collection("shifts").get()));
			}
		}
	});

	test("Update shifts", async () => {
		// Fetch all the shifts of all the doctors in all the clinics:
		const clinicSnaps = await getFirestore(thisAuth).collection("clinics").get();

		for (const clinicSnap of clinicSnaps.docs) {
			const doctorSnaps = await clinicSnap.ref.collection("doctors").get();

			for (const doctorSnap of doctorSnaps.docs) {
				const shiftSnaps = await doctorSnap.ref.collection("shifts").get();

				for (const shiftSnap of shiftSnaps.docs) {
					if (clinicSnap.data().owner === thisAuth.uid || doctorSnap.id === thisAuth.uid) {
						expect(await firebase.assertSucceeds(shiftSnap.ref.update({
							day: 6,
							start: {
								hours: 7,
								minutes: 30
							},
							end: {
								hours: 23,
								minutes: 15
							}
						})));
					}
					else {
						expect(await firebase.assertFails(shiftSnap.ref.update({
							day: 6,
							start: {
								hours: 7,
								minutes: 30
							},
							end: {
								hours: 23,
								minutes: 15
							}
						})));
					}
				}
			}
		}
	});

	test("Delete shifts", async () => {
		// Fetch all the shifts of all the doctors in all the clinics:
		const clinicSnaps = await getFirestore(thisAuth).collection("clinics").get();

		for (const clinicSnap of clinicSnaps.docs) {
			const doctorSnaps = await clinicSnap.ref.collection("doctors").get();

			for (const doctorSnap of doctorSnaps.docs) {
				const shiftSnaps = await doctorSnap.ref.collection("shifts").get();

				for (const shiftSnap of shiftSnaps.docs) {
					if (clinicSnap.data().owner === thisAuth.uid || doctorSnap.id === thisAuth.uid) {
						expect(await firebase.assertSucceeds(shiftSnap.ref.delete()));
					}
					else {
						expect(await firebase.assertFails(shiftSnap.ref.delete()));
					}
				}
			}
		}
	});
});