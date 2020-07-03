import Enum from 'easy-enums';
import Roles, {defineRole} from './base/Roles';
import C from './base/CBase';

export default C;

/**
 * app config
 */
C.app = {
	name: "Play.Good-Loop",
	service: "game",
	logo: "/img/favicon-32.png",
	// website: "https://good-loop.com",
	privacyPolicy: "https://doc.good-loop.com/privacy-policy.html",
	tsncs: "",
};

// NB: MonetaryAmount is deprecated - left here for old data
C.TYPES = new Enum("Stage Sprite Player Tile Room");

C.ROLES = new Enum("user admin");
C.CAN = new Enum("view edit admin sudo");
// setup roles
defineRole(C.ROLES.user, [C.CAN.view]);
defineRole(C.ROLES.admin, C.CAN.values);
