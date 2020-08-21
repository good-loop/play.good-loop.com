
import React from 'react';

const BG = ({src, children, opacity=0.5, size='cover'}) => {
	let style= {
		backgroundImage: `url('${src}')`,
		backgroundSize: size,
		height:"100%", width:"100%",
		position:'absolute',
		top:0, left:0,right:0,bottom:0,
		zIndex:0,
		opacity
	};
	return (<div >
		<div style={style} />
		{children}
	</div>);
};
export default BG;
