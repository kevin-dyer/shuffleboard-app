import io from 'socket.io-client'
import { push } from 'react-router-redux'
import {
	updatePucks,
	puckStateToMessage,
	puckMessageToState,
	startPollingPucks,
	mouseDown,
	mouseUp,
	ACCEPT_MODAL,
	PLAY_AGAIN,
	EXIT_GAME,
	exitGame,
	playAgain,
	stopTurn,
	userLeft,
	setBroadcastTimestamp,
	USER_LEFT
} from 'app/actions/shuffleboard-actions'
import moment from 'moment'

const uri = `http://${window.location.hostname}:8080`
let socket
let roomId
let broadcastStartTime


export const OPEN_GAME_SOCKET = 'OPEN_GAME_SOCKET'
export const CLOSE_GAME_SOCKET = 'CLOSE_GAME_SOCKET'
export const BROADCAST_BOARD_CONFIG = 'BROADCAST_BOARD_CONFIG'
export const RECEIVED_BOARD_CONFIG = 'RECEIVED_BOARD_CONFIG'
export const SET_SOCKET_ID = 'SET_SOCKET_ID'
export const USER_JOINED = 'USER_JOINED'
export const UPDATE_USER_COUNT = 'UPDATE_USER_COUNT'
export const BROADCAST_PUCKS = 'BROADCAST_PUCKS'
export const RECEIVED_PUCKS = 'RECEIVED_PUCKS'
export const TURN_HAS_STARTED = 'TURN_HAS_STARTED'
export const MOUSE_DOWN = 'MOUSE_DOWN'
export const MOUSE_UP = 'MOUSE_UP'
export const START_GAME = 'START_GAME' //call this to get roomId
export const ROOM_CREATED = 'ROOM_CREATED' //call this to set roomId to state
export const JOIN_GAME = 'JOIN_GAME'
export const JOINED_ROOM = 'JOINED_ROOM'
export const GAME_STARTED = 'GAME_STARTED'
export const DONE_WAITING = 'DONE_WAITING'
export const STOP_TURN = 'STOP_TURN'
export const PUCK_BROADCAST_COMPLETE = 'PUCK_BROADCAST_COMPLETE'
export const SET_BROADCAST_LATENCY = 'SET_BROADCAST_LATENCY'

export const init = (store) => {
	//TODO: switch back when deploy to Heroku
	socket = io(uri)
	// socket = io()
		.on('connect', function() {
			store.dispatch(setSocketId(this.id))
		})
		.on('disconnect', () => {
			console.log("Socket disconnected")
			socket.close();
  		socket.open();
  		//TODO: redirect to /start

  		//NOTE: this might not be good because if a user exits from different game, still might fire
  		store.dispatch(exitGame())
		});
	//listen here for updates to remote board configs
	socket.on(BROADCAST_BOARD_CONFIG, payload => {
		store.dispatch(receivedBoardConfig(payload))
	})

	socket.on(BROADCAST_PUCKS, payload => {
		const {boardConfig: {devices, socketId}} = store.getState()
		const device = devices[socketId]
		//Transform payload pucks to current device configuration
		const nextPucks = puckMessageToState(payload, device, devices)

		store.dispatch(updatePucks(nextPucks))
		store.dispatch(setBroadcastTimestamp())
	})

	socket.on(MOUSE_DOWN, payload => {
		mouseDown()
		store.dispatch(startPollingPucks())
	})

	socket.on(MOUSE_UP, payload => {
		mouseUp()
	})

	socket.on(ACCEPT_MODAL, payload => {
		//NOTE: do not call acceptModal action creator b/c it will broadcast the message
		store.dispatch({type: ACCEPT_MODAL})
	})

	//fired when YOU joined room
	socket.on(JOINED_ROOM, payload => {
		roomId = payload.roomId
		// Set the roomId and the PIN to state
		store.dispatch({type: JOINED_ROOM, ...payload})

		//redirect to Wait for Users modal
		store.dispatch(push('/join'))	
	})

	//fired when host joins room
	socket.on(GAME_STARTED, payload => {
		roomId = payload.roomId

		// TODO: create reducer that will set the roomId and the PIN to state
		store.dispatch({type: JOINED_ROOM, ...payload})
		store.dispatch(push('/join'))	
	})

	socket.on(DONE_WAITING, payload => {
		store.dispatch(push('/orientation'))
	})

	//fired when another user joined the room
	socket.on(USER_JOINED, payload => {
		console.log("USER_JOINED called, payload: ", payload)
		store.dispatch({type: USER_JOINED, ...payload})
	})

	socket.on(USER_LEFT, payload => {
		//NOTE: payload contains: socketId
		// console.log("USER_LEFT! payload: ", payload)
		// store.dispatch(updateUserCount(payload.userCount))

		// TODO: show pause game modal (or start new game) until user has returned
		//Question: when user rejoins - will they enter with a different action type?
		store.dispatch(userLeft(payload))
	})

	socket.on(PLAY_AGAIN, payload => {
		store.dispatch(playAgain())
	})

	socket.on(EXIT_GAME, payload => {
		store.dispatch(exitGame())
	})

	socket.on(STOP_TURN, payload => {
		store.dispatch(stopTurn())
	})

	socket.on(PUCK_BROADCAST_COMPLETE, payload => {
		const {boardConfig: {broadcastStartTime}} = store.getState()

		if (broadcastStartTime) {
			store.dispatch({
				type: SET_BROADCAST_LATENCY,
				broadcastLatency: Date.now() - broadcastStartTime
			})
		}
	})
}



export const emit = (type='', payload={}) =>
	socket.emit(type, {...payload, roomId})

//call this to broadcast local config
export function broadcastConfig(config) {
	return dispatch => {
		//NOTE: this also broadcasts back to this client, timestamp is sent on response
		emit(BROADCAST_BOARD_CONFIG, config)
	}
}

export function updateUserCount (userCount) {
	return {
		type: UPDATE_USER_COUNT,
		userCount
	}
}

function receivedBoardConfig(payload) {
	return {
		type: RECEIVED_BOARD_CONFIG,
		payload,
		timestamp: moment().valueOf()
	}
}
function setSocketId (socketId) {
	return {
		type: SET_SOCKET_ID,
		socketId
	}
}

export function broadcastPucks(pucks, device, devices) {
	//transform outgoing pucks to standard positions
	const outgoingPucks = puckStateToMessage(pucks, device, devices)

	//start timer
	broadcastStartTime = Date.now()

	emit(BROADCAST_PUCKS, outgoingPucks)
}

export function broadcastTurnStarted() {
	emit(TURN_HAS_STARTED)
}

export function broadcastMouseDown() {
	emit(MOUSE_DOWN)
}

export function broadcastMouseUp() {
	emit(MOUSE_UP)
}

export function broadcastAcceptModal() {
	emit(ACCEPT_MODAL)
}

export function startGame() {
	emit(START_GAME)
}

export function joinGame(roomPin) {
	emit(JOIN_GAME, {roomPin})
}

export function broadcastDoneWaiting(roomPin) {
	emit(DONE_WAITING)
}

export function broadcastPlayAgain() {
	emit(PLAY_AGAIN)
}

export function broadcastExitGame() {
	emit(EXIT_GAME)
}

export function broadcastStopTurn() {
	emit(STOP_TURN)
}

export function exitSocket() {
	if (socket) {
		socket.close()
	}
}