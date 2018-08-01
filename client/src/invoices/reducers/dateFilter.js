export const SET_FROM_DATE = 'SET_FROM_DATE';
export const SET_TO_DATE = 'SET_TO_DATE';
export const setFromDate = (timestamp) => ({
  type: SET_FROM_DATE,
  payload: timestamp
});
export const setToDate = (timestamp) => ({
  type: SET_TO_DATE,
  payload: timestamp
});

export default function dateFilter(state = {
  fromDate: new Date().valueOf(),
  toDate: new Date().valueOf()
}, action) {
  switch(action.type) {
  case SET_FROM_DATE:
    return {
      ...state,
      fromDate: action.payload
    };
  case SET_TO_DATE:
    return {
      ...state,
      toDate: action.payload
    };
  default: return state;
  }
}
