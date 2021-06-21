import React, { useContext, useEffect, useState } from "react";
import { Button } from "./Components/Button";
import { Popup } from "./Components/Popup";

export const PopupContext = React.createContext();


// Put this component at the root of any component tree in which you want to use popups:
export function ProvidePopups({children}) {
	const popupManager = useProvidePopups();
	return <PopupContext.Provider value={popupManager}>{children}</PopupContext.Provider>
}

// Include this inside components that want to access user authentication services:
export const usePopups = () => {
	return useContext(PopupContext);
}

function useProvidePopups() {
	const [popups, setPopups] = useState(new Map());
	const [popupArray, setPopupArray] = useState([]);

	useEffect(() => {
		// Update the display of the popups:
		const popup_array = [];

		for (const key of popups.keys()) {
			popup_array.push(popups.get(key));
		}

		setPopupArray(popup_array);
	}, [popups]);

	const add = (popup) => {
		// Only allow 1 popup to be added per key. If the key is already used, don't add the popup.
		// if (!popups.has(popup.key)) {
		// }

		const popup_map = new Map();

		for (const key of popups.keys()) {
			if (key !== popup.key) popup_map.set(key, popups.get(key));
		}

		popup_map.set(popup.key, popup);
		setPopups(popup_map);
	}

	const remove = (popup) => {
		// Find the popup that has the specified key and remove it:
		const popup_map = new Map();

		for (const key of popups.keys()) {
			if (key !== popup.key) popup_map.set(key, popup.key);
		}

		setPopups(popup_map);
	}

	const clear = () => {
		setPopups(new Map());
	}

	/**
	 * Show an error message.
	 * @param {*} body JSX of the Popup body.
	 */
	 const create = (title, body) => {
		const close = () => remove(popup);
	
		const popup = 
		<Popup
			key={title}
			title={title}
			close={close}
		>
			{body}
		</Popup>;
	
		add(popup);
	}

	/**
	 * Show an error message.
	 * @param {*} body JSX of the Popup body.
	 */
	const error = body => {
		const close = () => remove(popup);

		const popup = 
		<Popup
			key={"Error"}
			title="Error"
			close={close}
		>
			{body}
			<div className="buttonBar">
				<Button label="Close" action={close} />
			</div>
		</Popup>;

		add(popup);
	}

	return {
		popups: popupArray,
		add,
		remove,
		clear,
		create,
		error
	};
}