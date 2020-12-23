// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/auth";
import "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
	apiKey: "AIzaSyBazKqkG-2RCZYS0JqtIOkVYZU9TvKORaQ",
	authDomain: "csfpd-da7e7.firebaseapp.com",
	projectId: "csfpd-da7e7",
	storageBucket: "csfpd-da7e7.appspot.com",
	messagingSenderId: "604605933482",
	appId: "1:604605933482:web:92d68b782d5a32ae0c2dd3",
	measurementId: "G-P65FTMVX43"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const fb = firebase;
export const db = firebase.firestore();