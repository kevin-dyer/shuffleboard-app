import {
  RECEIVED_BOARD_CONFIG,
  SET_SOCKET_ID,
  UPDATE_USER_COUNT
} from 'app/actions/socket-actions'

import {
  ADD_PUCK,
  UPDATE_PUCKS
} from 'app/actions/shuffleboard-actions'
import _ from 'underscore'

const mergeBoardConfigs = (devices, device) => {
  return {
    ...devices,
    [device.id]: {
      ...devices[device.id],
      ...device
    }
  }
}

const initialState = {
  devices: {},
  socketId: null,
  userCount: 1, //always start with self
  pucks: []
}

export function boardConfig(state = initialState, action = {}) {
  switch (action.type) {
    case RECEIVED_BOARD_CONFIG:
      return {
        ...state,
        devices: mergeBoardConfigs(state.devices, action.payload)
      }

    case SET_SOCKET_ID:
      return {
        ...state,
        socketId: action.socketId
      }

    case UPDATE_USER_COUNT:
      return {
        ...state,
        userCount: action.userCount
      }

    case ADD_PUCK: {
      const nextPucks = [...state.pucks]
      nextPucks.push(action.puck)

      console.log("ADD_PUCK [nextPucks]: ", [...state.pucks, action.puck])
      return {
        ...state,
        pucks: nextPucks
      }
    }

    case UPDATE_PUCKS:
      return {
        ...state,
        pucks: action.pucks
      }

    default:
      return state;
  }
}