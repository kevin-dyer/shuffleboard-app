import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';

import friends, { NAME as friendsName } from 'features/friends';
import {boardConfig} from './reducers/boardConfig';

export default combineReducers({
  routing,
  [friendsName]: friends,
  boardConfig 
});
