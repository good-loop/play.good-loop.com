
import DataClass, {getType, nonce} from '../base/data/DataClass';

class Rect extends DataClass {
	x;
	y;
	z=0;
	width;
	height;
	depth=0;
	constructor(base) {
		super({});
		// NB: minor efficiency/cleanliness: 
		// base might be e.g. a Sprite - and we only want to copy the Rect part
		this['@type'] = 'Rect';
		if ( ! base) return;
		this.x = base.x;
		this.y = base.y;
		if (base.z !== undefined) this.z = base.z;
		this.width = base.width;
		this.height = base.height;
		if (base.depth !== undefined) this.depth = base.depth;
	}
} // ./Rect
DataClass.register(Rect, 'Rect');

/**
 * duck type
 */
Rect.isa = r => {
	if ( ! r) return false;
	if (getType(r)==='Rect') return true;
	const yes = r.x !== undefined && r.y !== undefined && r.width !== undefined && r.height !== undefined;
	return yes;
};

/**
 * a {Rect} x, y, width, height
 * b {Rect}
 * @returns true if a overlaps b (though false if a===b)
 */
Rect.intersects = (a, b) => {
	if (a===b) return false;
	Rect.assIsa(a);
	Rect.assIsa(b);
	// ref https://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
	// NO - this fails for e.g. a = 1x1 box at (10,10), b = 15x15 box at (0,0)
	// const yes = (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) &&
    //      (Math.abs(a.y - b.y) * 2 < (a.height + b.height));

	// x
	if (a.x < b.x) {
		if (a.x + a.width < b.x) return false;
	} else {
		if (b.x + b.width < a.x) return false;
	}
	// y
	if (a.y < b.y) {
		if (a.y + a.height < b.y) return false;
	} else {
		if (b.y + b.height < a.y) return false;
	}

	return true;
};

const This = Rect;
const Super = Object.assign({}, This);
export default Rect;
