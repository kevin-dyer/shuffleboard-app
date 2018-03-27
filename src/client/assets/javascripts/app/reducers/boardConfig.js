import {
  RECEIVED_BOARD_CONFIG,
  SET_SOCKET_ID,
  UPDATE_USER_COUNT
} from 'app/actions/socket-actions'

import {
  ADD_PUCK,
  UPDATE_PUCKS,
  // CANCEL_MODAL,
  ACCEPT_MODAL,
  SHOW_START_GAME_MODAL,
  SHOW_NEXT_TURN_MODAL,
  SHOW_GAME_OVER_MODAL,
  TEAM_TYPES
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

//Need gamestate to hold score and whos turn it is and is game over
const initialState = {
  devices: {},
  socketId: null,
  userCount: 1, //always start with self
  pucks: [],
  dialog: {
    title: '',
    accepted: true
  }
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