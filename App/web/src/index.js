//Reactjs:
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { LoginPage } from './LoginPage';
import { RegisterPage } from "./RegisterPage";

import {
	BrowserRouter as Router,
	Switch,
	Route
} from "react-router-dom";

ReactDOM.render(
	<Router>
		<Switch>
			<Route exact path="/">
				<LoginPage />
			</Route>
			<Route path="/login">
				<LoginPage />
			</Route>
			<Route path="/register">
				<RegisterPage />
			</Route>
		</Switch>
	</Router>,
	document.getElementById('root')
);