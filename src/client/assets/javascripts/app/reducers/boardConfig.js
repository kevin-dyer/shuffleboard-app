import {
  RECEIVED_BOARD_CONFIG,
  SET_SOCKET_ID,
  UPDATE_USER_COUNT,
  JOINED_ROOM,
  USER_JOINED,
  USER_LEFT
} from 'app/actions/socket-actions'

import {
  ADD_PUCK,
  UPDATE_PUCKS,
  // CANCEL_MODAL,
  ACCEPT_MODAL,
  SHOW_START_GAME_MODAL,
  SHOW_NEXT_TURN_MODAL,
  SHOW_GAME_OVER_MODAL,
  SHOW_ORIENTATION_MODAL,
  SHOW_ALLOW_JOIN_MODAL,
  TEAM_TYPES,
  START_GAME
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

//Need gamestate to hold score and whos turn it is and is game over
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
  // showJoinModal: false
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

    // case UPDATE_USER_COUNT:
    //   return {
    //     ...state,
    //     userCount: action.userCount
    //   }

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
      const nextPucks = [...state.pucks, action.puck]
      // nextPucks.push(action.puck)

      // console.log("ADD_PUCK [nextPucks]: ", [...state.pucks, action.puck])
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



      //TODO: change these generic actions out for specific ones
      // let GameDialog component determine which action to ifre
    // case CANCEL_MODAL:
    //   return {
    //     ...state
    //   }

    // case ACCEPT_MODAL:
    //   return {
    //     ...state,
    //     dialog: {
    //       ...dialog,
    //       accepted: true
    //     }
    //   }

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
          title: `${action.isRedsTurn ? TEAM_TYPES.RED : TEAM_TYPES.BLUE} team's turn!`,
          body: `Red: ${action.score.red}, Blue: ${action.score.blue}`
        }
      }

    case SHOW_GAME_OVER_MODAL:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          accepted: false,
          title: `${action.score.red > action.score.blue ? TEAM_TYPES.RED : TEAM_TYPES.BLUE} team won!`,
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

    //This wont work because the modal should display PIN and number of clients
    //Need to display a specific modal
    // case SHOW_ALLOW_JOIN_MODAL:
    //   return {
    //     ...state,
    //     showJoinModal: true
    //   }
    // case SHOW_ALLOW_JOIN_MODAL:
    //   return {
    //     ...state,
    //     dialog: {
    //       ...state.dialog,
    //       accepted: false,
    //       title: 'Game PIN: ',
    //       body: ''
    //     }
    //   }

    case ACCEPT_MODAL:
      return {
        ...state,
        dialog: {
          ...state.dialog,
          accepted: true
        }
      }

    default:
      return state;
  }
}