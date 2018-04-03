import React from 'react';
import { Route, IndexRoute, Redirect } from 'react-router';

import App from './App';
// import FriendsView from 'features/friends/components/FriendsView';
import NotFoundView from 'components/NotFound';
import ConfigureBoard from 'components/ConfigureBoard';
import Shuffleboard from 'components/Shuffleboard';
import StartGameDialog from 'components/StartGameDialog';
import JoinGameDialog from 'components/JoinGameDialog';

export default (
  <Route path="/" component={App}>
    <IndexRoute component={Shuffleboard} />
    <Route path="orientation" component={ConfigureBoard}/>
    <Route path="shuffleboard" component={Shuffleboard}/>
    <Route path="start" component={StartGameDialog} />
    <Route path="join" component={JoinGameDialog} />
    <Route path="404" component={NotFoundView} />
    <Redirect from="*" to="404" />
  </Route>
);
