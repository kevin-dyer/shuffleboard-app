import { createStore, applyMiddleware, compose } from 'redux';
import promiseMiddleware from 'redux-promise';
import thunk from 'redux-thunk';
import { routerMiddleware } from 'react-router-redux'
import { browserHistory } from 'react-router';

import rootReducer from '../reducer';

const routerMid = routerMiddleware(browserHistory)
const middlewares = [
  promiseMiddleware,
  thunk,
  routerMid
];

const enhancer = compose(
  applyMiddleware(...middlewares)
);

export default function configureStore(initialState) {
  // return enhancer(rootReducer, initialState);

  // return createStore(rootReducer, initialState, enhancer)
  return createStore(rootReducer, initialState, enhancer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
}
