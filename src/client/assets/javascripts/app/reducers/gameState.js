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


//NOTE: this is calculated in shuffleboard-actions
//Need gamestate to hold score and whos turn it is and is game over
const initialState = {
  turnInProgress: false
  isGameOver: false,
  redScore: 0,
  blueScore: 0,
  redsTurn: true
}

//big note: you can do all of this by calculating from pucks
// so i can create the pucks one at a time, or create all but hold them out of frame?
// creating them on the fly would be tough. Although they can only be created, not destroyed, thats easier
// and I can calculate the game state based on the puck positions (which should be super well synced)
  // if no pucks, game has started
    // here we can decide who will go first, or just always start with red - simple
    // MODAL (FIRST PHONE) ready to begin? RED TEAM starts!
  // Then when there are more red then blue, its blue's turn
    // MODAL (FIRST PHONE) SCORE: Red team: 2, Blue team: 0, Blue team's turn - OK
  // Then after last puck is thrown, its Game Over
    // MODAL (Red Team Won! SCORE: Red team: 3, Blue team: 1)
export function gameState(state = initialState, action = {}) {
  switch (action.type) {
    // case RECEIVED_BOARD_CONFIG:
    //   return {
    //     ...state,
    //     devices: mergeBoardConfigs(state.devices, action.payload)
    //   }

    
    default:
      return state;
  }
}