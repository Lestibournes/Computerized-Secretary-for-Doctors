import "./TabbedContainer.css";

import { useState } from "react";

export function TabbedContainer({children}) {
	const [selectedTab, setSelectedTab] = useState(0);

	const tabs = [];

	for (const index in children) {
		tabs.push(
			<div
				className={"tab" + (index == selectedTab ? " selected" : "")}
				onClick={() => setSelectedTab(index)}
			>
				<i class={"fas " + children[index].props.icon}></i>
				<div className="tab-title">{children[index].props.title}</div>
			</div>
		);
	}
	return (
		<div className="tab-container">
			<div className="tab-bar">
				{tabs}
			</div>
			<div className="tab-body">
				{children[selectedTab]}
			</div>
		</div>
	);
}