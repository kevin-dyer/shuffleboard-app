import {
  RECEIVED_BOARD_CONFIG,
  SET_SOCKET_ID,
  UPDATE_USER_COUNT
} from 'app/actions/socket-actions'
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
  userCount: 1 //always start with self
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

    default:
      return state;
  }
}