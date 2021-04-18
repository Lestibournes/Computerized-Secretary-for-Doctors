import { Link } from "react-router-dom";
import './Card.css';

export function Card({title, body, footer, link, action, image, altText}) {
	if (link) {
		return (
			<Link to={link} className="card">
				{image ? <img alt={altText} src={image} /> : null}
				<div className="body">
					<div><big>{title}</big></div>
					<div><small>{body}</small></div>
					<div><small>{footer}</small></div>
				</div>
			</Link>
		);
	}

	return (
		<div onClick={action} className="card">
			{image ? <img alt={altText} src={image} /> : null}
			<div className="body">
				<div><big>{title}</big></div>
				<div><small>{body}</small></div>
				<div><small>{footer}</small></div>
			</div>
		</div>
	);
}