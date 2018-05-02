import {
  RECEIVED_BOARD_CONFIG,
  SET_SOCKET_ID,
  UPDATE_USER_COUNT,
  JOINED_ROOM,
  USER_JOINED,
  SET_BROADCAST_LATENCY
} from 'app/actions/socket-actions'

import {
  ADD_PUCK,
  UPDATE_PUCKS,
  ACCEPT_MODAL,
  SHOW_START_GAME_MODAL,
  SHOW_NEXT_TURN_MODAL,
  SHOW_GAME_OVER_MODAL,
  SHOW_ORIENTATION_MODAL,
  SHOW_ALLOW_JOIN_MODAL,
  TEAM_TYPES,
  START_GAME,
  PLAY_AGAIN,
  CLEAR_DEVICES,
  CLEAR_PUCKS,
  USER_LEFT,
  SET_BROADCAST_DEVICE,
  SET_BROADCAST_TIMESTAMP
} from 'app/actions/shuffleboard-actions'

import _ from 'underscore'

const mergeBoardConfigs = (devices, device, timestamp) => {
  return {
    ...devices,
    [device.id]: {
      ...devices[device.id],
      ...device,
      timestamp
    }
  }
}

//NOTE: gamestate which holds score, whos turn it is and is game over
//      - are calculated on the fly by getGameState
const initialState = {
  clients: [],
  devices: {},
  socketId: null,
  roomId: null,
  userCount: 1, //always start with self
  pucks: [],
  dialog: {
    title: '',
    accepted: true
  },
  broadcastDevice: null,
  broadcastLatency: 0,
  broadcastTimestamp: 0
}

export function boardConfig(state = initialState, action = {}) {
  switch (action.type) {
    case RECEIVED_BOARD_CONFIG:
      return {
        ...state,
        devices: mergeBoardConfigs(state.devices, action.payload, action.timestamp)
      }

    case SET_SOCKET_ID:
      return {
        ...state,
        socketId: action.socketId
      }

    case JOINED_ROOM:
      return {
        ...state,
        roomId: action.roomId,
        roomPin: action.roomPin,
        clients: action.clients
      }

    case USER_JOINED:
      return {
        ...state,
        clients: [...state.clients, action.socketId]
      }

    case USER_LEFT: {
      const clientIndex = state.clients.indexOf(action.socketId)
      let nextClients = [...state.clients]

      if (clientIndex > -1) {
        nextClients.splice(clientIndex, 1)
      }

      return {
        ...state,
        clients: nextClients
      }
    }

    case ADD_PUCK: {
      return {
        ...state,
        pucks: [
          ...state.pucks,
          action.puck
        ]
      }
    }

    case UPDATE_PUCKS:
      return {
        ...state,
        pucks: action.pucks
      }

    case SHOW_START_GAME_MODAL:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          accepted: false,
          title: 'Ready to start the game?',
          body: 'Red team goes first'
        }
      }

    case SHOW_NEXT_TURN_MODAL:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          accepted: false,
          title: `${(action.isRedsTurn ? TEAM_TYPES.RED : TEAM_TYPES.BLUE).toLowerCase()}'s turn (${action.turnNumber}/4)`,
          body: `Red: ${action.score.red}, Blue: ${action.score.blue}`
        }
      }

    case SHOW_GAME_OVER_MODAL:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          accepted: false,
          title: 'Game Over',
          body: `Red: ${action.score.red}, Blue: ${action.score.blue}`
        }
      }

    case SHOW_ORIENTATION_MODAL:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          accepted: false,
          title: 'Orient the Board',
          body: 'Drag a finger from the start of the board to the end to configure the board.'
        }
      }

    case ACCEPT_MODAL:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          accepted: true
        }
      }

    case SET_BROADCAST_LATENCY:
      return {
        ...state,
        broadcastLatency: action.broadcastLatency
      }

    case SET_BROADCAST_DEVICE:
      return {
        ...state,
        broadcastDevice: action.broadcastDevice
      }

    case CLEAR_PUCKS:
      return {
        ...state,
        pucks: []
      }

    case CLEAR_DEVICES:
      return {
        ...state,
        devices: {}
      }

    case SET_BROADCAST_TIMESTAMP:
      return {
        ...state,
        broadcastTimestamp: action.broadcastTimestamp
      }

    default:
      return state;
  }
}