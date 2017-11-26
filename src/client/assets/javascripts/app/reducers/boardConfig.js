import {
  RECEIVED_BOARD_CONFIG,
  SET_SOCKET_ID
} from 'app/actions/socket-actions'
import _ from 'underscore'

const mergeBoardConfigs = (devices, device) => {

  // const oldDevice = _.findWhere(devices, {id: device.id})
  // let nextDevices
  // if (oldDevice) {
  //   return 
  // }
  // return _.sortBy([
  //   ...devices,
  //   device
  // ], d => d.timestamp)
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
  socketId: null
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

    default:
      return state;
  }
}