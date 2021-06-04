import React, { useContext, useEffect, useState } from "react";

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

		for (const entry of popups) {
			popup_array.push(entry[1]);
		}

		setPopupArray(popup_array);
	}, [popups]);

	const add = (popup) => {
		// Only allow 1 popup to be added per key. If the key is already used, don't add the popup.
		if (!popups.has(popup.key)) {
			const popup_map = new Map(popups);
			popup_map.set(popup.key, popup);
			setPopups(popup_map);
		}
	}

	const remove = (popup) => {
		// Find the popup that has the specified key and remove it:
		const popup_map = new Map(popups);
		popup_map.delete(popup.key);
		setPopups(popup_map);
	}

	const clear = () => {
		setPopups(new Map());
	}

	return {
		popups: popupArray,
		add,
		remove,
		clear
	};
}