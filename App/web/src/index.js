//Reactjs:
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { LoginPage } from './LoginPage';
import { RegisterPage } from "./RegisterPage";

ReactDOM.render(
	<React.StrictMode>
		<LoginPage />
	</React.StrictMode>,
	document.getElementById('root')
);