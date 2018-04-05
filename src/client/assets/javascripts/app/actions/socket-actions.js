import io from 'socket.io-client'
import { push } from 'react-router-redux'
import {
	updatePucks,
	puckStateToMessage,
	puckMessageToState,
	startPollingPucks,
	mouseDown,
	mouseUp,
	ACCEPT_MODAL
} from 'app/actions/shuffleboard-actions'
import moment from 'moment'

// const uri = 'https://localhost:8080'
// const uri = window.location.origin
const uri = `http://${window.location.hostname}:8080`
// const uri = 'http://localhost'
// const uri = `http://${window.location.hostname}:65080`
let socket
let roomId


export const OPEN_GAME_SOCKET = 'OPEN_GAME_SOCKET'
export const CLOSE_GAME_SOCKET = 'CLOSE_GAME_SOCKET'
export const BROADCAST_BOARD_CONFIG = 'BROADCAST_BOARD_CONFIG'
export const RECEIVED_BOARD_CONFIG = 'RECEIVED_BOARD_CONFIG'
export const SET_SOCKET_ID = 'SET_SOCKET_ID'
export const USER_JOINED = 'USER_JOINED'
export const USER_LEFT = 'USER_LEFT'
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

export const init = (store) => {
	//TODO: switch back when deploy to Heroku
	socket = io(uri)
	// socket = io()
		.on('connect', function() {
			store.dispatch(setSocketId(this.id))
		})
		.on('disconnect', () => {
			console.log("Socket disconnected, attempting to socket.open()")
  		socket.open();
		});
	//listen here for updates to remote board configs
	socket.on(BROADCAST_BOARD_CONFIG, payload => {
		console.log("ws RECEIVED_BOARD_CONFIG, payload: ", payload)
		store.dispatch(receivedBoardConfig(payload))
	})

	// socket.on(USER_JOINED, payload => {
	// 	console.log("USER_JOINED!")
	// 	// store.dispatch(updateUserCount(payload.userCount))
	// })
	socket.on(USER_LEFT, payload => {
		//NOTE: payload contains: socketId
		console.log("USER_LEFT!")
		// store.dispatch(updateUserCount(payload.userCount))

		// TODO: show pause game modal (or start new game) until user has returned
		//Question: when user rejoins - will they enter with a different action type?

	})

	//TODO: Prevent this from fireing if originated from self
	socket.on(BROADCAST_PUCKS, payload => {
		const {boardConfig: {devices, socketId}} = store.getState()
		const device = devices[socketId]
		
		// console.log("RECEIVED_PUCKS! payload: ", payload)

		//NOTE: need to modify the payload based on the current device directionY and inverted
		//TODO: transform payload here, get state from store.getState()

		// console.log("on BROADCAST_PUCKS payload: ", payload)
		const nextPucks = puckMessageToState(payload, device, devices)

		// console.log("nextPucks: ", nextPucks)
		store.dispatch(updatePucks(nextPucks))
	})

	// socket.on(TURN_HAS_STARTED, payload => {
	// 	console.log("TURN_HAS_STARTED received from server")
	// 	store.dispatch(startPollingPucks())
	// })

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

		// console.log('JOINED_ROOM called, payload: ', payload)

		// TODO: create reducer that will set the roomId and the PIN to state
		store.dispatch({type: JOINED_ROOM, ...payload})

		//redirect to Wait for Users modal
		store.dispatch(push('/join'))	
	})

	//fired when host joins room
	socket.on(GAME_STARTED, payload => {
		roomId = payload.roomId

		// TODO: create reducer that will set the roomId and the PIN to state
		store.dispatch({type: JOINED_ROOM, ...payload})

		//redirect to origin
		// also show modal to show: Proceed once all the devices have joined
		// this can be a modal on componentDidMount of the trace
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
		store.dispatch({type: USER_LEFT, ...payload})
	})
}



export const emit = (type='', payload={}) =>
	socket.emit(type, {...payload, roomId})

export function openGameSocket() {
	//open websocket here
}

export function closeGameSocket() {
	//close ws here
}

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
	// console.log("receivedBoardConfig called!")
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

	//TODO: modify pucks here based on current device
	// console.log("STATE broadcastPucks first puck position x: ", pucks[0].position.x, ", y: ", pucks[0].position.y)
	const outgoingPucks = puckStateToMessage(pucks, device, devices)


	// console.log("emit broadcastPucks outgoingPucks: ", outgoingPucks, ", state pucks: ", pucks)
	// console.log("outgoingPucks broadcastPucks first puck position x: ", outgoingPucks[0].position.x, ", y: ", outgoingPucks[0].position.y)
	emit(BROADCAST_PUCKS, outgoingPucks)
}

export function broadcastTurnStarted() {
	// console.log("emiting TURN_HAS_STARTED")
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
	console.log("calling joinGame roomPin: ", roomPin)
	emit(JOIN_GAME, {roomPin})
}

export function broadcastDoneWaiting(roomPin) {
	emit(DONE_WAITING)
}



