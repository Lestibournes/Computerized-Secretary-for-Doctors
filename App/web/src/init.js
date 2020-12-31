// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
import firebase from "firebase/app";

// Add the Firebase services that you want to use
import "firebase/auth";
import "firebase/firestore";
import "firebase/functions";

import "./firebase_config";

export const fb = firebase;
export const db = firebase.firestore();
export const fn = firebase.functions();
