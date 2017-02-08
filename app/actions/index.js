import cardsActions from './cards';
import * as userActions from './user'; // ES6 way
import * as shuttleActions from './shuttle';
import * as mapActions from './map';
import * as weatherActions from './weather';
import * as surfActions from './surf';
import * as diningActions from './dining';

module.exports = {
	...cardsActions,
	...shuttleActions,
	...mapActions,
	...userActions,
	...weatherActions,
	...surfActions,
	...diningActions,
};
