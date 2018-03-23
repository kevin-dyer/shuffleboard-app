import { createStore, applyMiddleware, compose } from 'redux';
import promiseMiddleware from 'redux-promise';
import thunk from 'redux-thunk';

import rootReducer from '../reducer';


const middlewares = [
  promiseMiddleware,
  thunk
];

const enhancer = compose(
  applyMiddleware(...middlewares)
);

export default function configureStore(initialState) {
  // return enhancer(rootReducer, initialState);

  // return createStore(rootReducer, initialState, enhancer)
  return createStore(rootReducer, initialState, enhancer, window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__())
}
