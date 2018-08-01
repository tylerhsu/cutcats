export const SET_USER = 'SET_USER';

export function setUser(user) {
  return {
    type: SET_USER,
    payload: user
  };
}

export default function user(state = {
  loading: null,
  payload: null,
  error: null
}, action) {
  switch (action.type) {
  case SET_USER:
    return {
      loading: false,
      payload: action.payload,
      error: false
    };
  default: return state;
  }
}
