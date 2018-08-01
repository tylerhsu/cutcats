import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';

export default function configureStore(reducer, preloadedState) {
  return createStore(
    reducer,
    preloadedState,
    applyMiddleware(
      thunkMiddleware
    )
  );
}
