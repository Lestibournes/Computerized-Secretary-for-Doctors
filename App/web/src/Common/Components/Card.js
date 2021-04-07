import { Link } from "react-router-dom";
import './Card.css';

export function Card({title, body, footer, link, image, altText}) {
	return (
		<Link to={link} className={image ? "fancyCard" : "plainCard"}>
			{image ? <img alt={altText} src={image} /> : null}
			<div className="cardTop"><big>{title}</big></div>
			<div className="cardCenter"><small>{body}</small></div>
			<div className="cardBottom"><small>{footer}</small></div>
		</Link>
	);
}