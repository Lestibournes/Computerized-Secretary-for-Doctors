const { thisAuth, thisClinicData, otherClinicData, getAdminFirestore, thisUserData, otherAuth, otherUserData, thisShiftData, otherShiftData, thisTypesData, otherTypesData, thisDoctorSpecializations, otherDoctorSpecializations } = require('./shared');

async function popuplateTestDatabase(db) {
	// Create the clinic:
	const thisClinicID = (await db.collection("clinics").add(thisClinicData)).id;
	const otherClinicID = (await db.collection("clinics").add(otherClinicData)).id;

	// Setting up this doctor with his shifts in his own clinic:
	const thisUserRef = db.collection("users").doc(thisAuth.uid);
	await thisUserRef.set(thisUserData);
	await thisUserRef.update({doctor: true});

	for (const specialization of thisDoctorSpecializations) {
		await thisUserRef.collection("specializations").doc(specialization).set({name: specialization});
	}

	await db.collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).set({
		user: thisAuth.uid,
		clinic: thisClinicID,
		minimum: 15
	});

	const thisTypesRef = db.collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).collection("types");

	for (const TypeData of thisTypesData) {
		thisTypesRef.add(TypeData);
	}

	const thisShiftsRef = db.collection("clinics").doc(thisClinicID).collection("doctors").doc(thisAuth.uid).collection("shifts");

	for (const shiftData of thisShiftData) {
		thisShiftsRef.add(shiftData);
	}

	// Setting up the doctor with his shifts in both clinics:
	const otherUserRef = db.collection("users").doc(otherAuth.uid);
	await otherUserRef.set(otherUserData);
	await otherUserRef.update({doctor: true});

	for (const specialization of otherDoctorSpecializations) {
		await otherUserRef.collection("specializations").doc(specialization).set({name: specialization});
	}

	await db.collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).set({
		user: otherAuth.uid,
		clinic: otherClinicID,
		minimum: 15
	});

	const otherTypesRef = db.collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).collection("types");

	for (const typeData of otherTypesData) {
		otherTypesRef.add(typeData);
	}

	const otherShiftsRef = db.collection("clinics").doc(otherClinicID).collection("doctors").doc(otherAuth.uid).collection("shifts");

	for (const shiftData of otherShiftData) {
		otherShiftsRef.add(shiftData);
	}
}

test("Popuplate the database", () => {
	popuplateTestDatabase(getAdminFirestore());
	expect(true);
})