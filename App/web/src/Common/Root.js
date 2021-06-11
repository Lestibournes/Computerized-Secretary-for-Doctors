import React, { useContext, useState } from "react";

export const RootContext = React.createContext();


// Put this component at the root of any component tree in which you want to change or link to root:
export function ProvideRoot({children}) {
	const root = useProvideRoot();
	return <RootContext.Provider value={root}>{children}</RootContext.Provider>
}

// Include this inside components that want to link to or change the root of the url:
export const useRoot = () => {
	return useContext(RootContext);
}

function useProvideRoot() {
	const [root, setRoot] = useState("");

	const get = () => {
		if (root) return "/" + root;

		return root;
	};

	return {
		set: setRoot,
		get
	};
}