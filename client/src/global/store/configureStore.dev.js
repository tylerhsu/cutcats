import { createStore, applyMiddleware } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';

export default function configureStore(reducer, preloadedState) {
  return createStore(
    reducer,
    preloadedState,
    applyMiddleware(
      thunkMiddleware,
      createLogger()
    )
  );
}
