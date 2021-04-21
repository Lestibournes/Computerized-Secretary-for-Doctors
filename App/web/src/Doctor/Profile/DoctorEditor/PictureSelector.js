import '../../../Common/Components/Input.css';
import { useField } from 'formik';
import { useState } from 'react';
import { storage } from '../../../init';

/**
 * A Formik text input component.
 */
 export function PictureSelector({ src, alt, callback }) {
	return (
		<div className="Input">
			<label htmlFor="pictureSelector"><img src={src} alt={alt} /></label>
			<input id="pictureSelector" type="file"
				onChange={e => callback(e.target.files[0])}
			/>
		</div>
	);
};