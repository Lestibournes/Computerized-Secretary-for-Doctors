import "./TabbedContainer.css";

import { useState } from "react";

export function TabbedContainer({children}) {
	const [selectedTab, setSelectedTab] = useState(0);

	const tabs = [];

	for (const index in children) {
		tabs.push(
			<div
				className={(index == selectedTab ? " selected" : "")}
				onClick={() => setSelectedTab(index)}
			>
				<i class={"fas " + children[index].props.icon}></i>
				<heading>{children[index].props.title}</heading>
			</div>
		);
	}
	return (
		<div className="TabbedContainer">
			<div className="TabBar">
				{tabs}
			</div>
			<div className="TabBody">
				{children[selectedTab]}
			</div>
		</div>
	);
}