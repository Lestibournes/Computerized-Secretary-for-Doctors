//Reactjs:
import React from 'react';
import { Strings } from '../Common/Classes/strings';
import { Header } from '../Common/Components/Header';
import { useRoot } from '../Common/Root';
import { Button } from '../Common/Components/Button';

export function AppointmentDeletedPage() {
	const root = useRoot();

	return (
		<div className="Page">
			<Header />
			<h1>{Strings.instance.get(49)}</h1>
			<h2>{Strings.instance.get(51)}</h2>
			<main>
				<p>{Strings.instance.get(52)}</p>
				<p><Button link={root.get() + "/"} label={Strings.instance.get(54)} /></p>
			</main>
		</div>
	);
}