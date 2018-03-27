import io from 'socket.io-client'
import {
	updatePucks,
	puckStateToMessage,
	puckMessageToState,
	startPollingPucks,
	mouseDown,
	mouseUp
} from 'app/actions/shuffleboard-actions'
// const uri = 'https://localhost:8080'
// const uri = window.location.origin
const uri = `http://${window.location.hostname}:8080`
// const uri = 'http://localhost'
// const uri = `http://${window.location.hostname}:65080`
let socket


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

export const init = (store) => {
	//TODO: switch back when deploy to Heroku
	socket = io(uri)
	// socket = io()
		.on('connect', function() {
			store.dispatch(setSocketId(this.id))
		})
	//listen here for updates to remote board configs
	socket.on(BROADCAST_BOARD_CONFIG, payload => {
		console.log("ws RECEIVED_BOARD_CONFIG, payload: ", payload)
		store.dispatch(receivedBoardConfig(payload))
	})

	socket.on(USER_JOINED, payload => {
		console.log("USER_JOINED! payload.userCount: ", payload.userCount)
		store.dispatch(updateUserCount(payload.userCount))
	})
	socket.on(USER_LEFT, payload => {
		console.log("USER_LEFT!")
		store.dispatch(updateUserCount(payload.userCount))
	})

	//TODO: Prevent this from fireing if originated from self
	socket.on(BROADCAST_PUCKS, payload => {
		const {boardConfig: {devices, socketId}} = store.getState()
		const device = devices[socketId]
		
		// console.log("RECEIVED_PUCKS! device from state: ", device)

		//NOTE: need to modify the payload based on the current device directionY and inverted
		//TODO: transform payload here, get state from store.getState()
		const nextPucks = puckMessageToState(payload, device)
		store.dispatch(updatePucks(nextPucks))
	})

	socket.on(TURN_HAS_STARTED, payload => {
		console.log("TURN_HAS_STARTED received from server")
		store.dispatch(startPollingPucks())
	})

	socket.on(MOUSE_DOWN, payload => {
		mouseDown()
		store.dispatch(startPollingPucks())
	})

	socket.on(MOUSE_UP, payload => {
		mouseUp()
		// store.disptach(mouseUp())
	})
}



export const emit = (type, payload) =>
	socket.emit(type, payload)

export function openGameSocket() {
	//open websocket here
}

export function closeGameSocket() {
	//close ws here
}

//call this to broadcast local config
export function broadcastConfig(config) {
	return dispatch => {
		emit(BROADCAST_BOARD_CONFIG, config)

		console.log("broadcastConfig called, calling receivedBoardConfig")
		dispatch(receivedBoardConfig(config)) //To update self in devices
	}
}

export function updateUserCount (userCount) {
	return {
		type: UPDATE_USER_COUNT,
		userCount
	}
}

function receivedBoardConfig(payload) {
	console.log("receivedBoardConfig called!")
	return {
		type: RECEIVED_BOARD_CONFIG,
		payload
	}
}
function setSocketId (socketId) {
	return {
		type: SET_SOCKET_ID,
		socketId
	}
}

export function broadcastPucks(pucks, device) {

	//TODO: modify pucks here based on current device
	// console.log("STATE broadcastPucks first puck position x: ", pucks[0].position.x, ", y: ", pucks[0].position.y)
	const outgoingPucks = puckStateToMessage(pucks, device)

	// console.log("outgoingPucks broadcastPucks first puck position x: ", outgoingPucks[0].position.x, ", y: ", outgoingPucks[0].position.y)
	emit(BROADCAST_PUCKS, outgoingPucks)
}

export function broadcastTurnStarted() {
	console.log("emiting TURN_HAS_STARTED")
	emit(TURN_HAS_STARTED)
}

export function broadcastMouseDown() {
	emit(MOUSE_DOWN)
}

export function broadcastMouseUp() {
	emit(MOUSE_UP)
}


//IDK if i like the polling done here, id rather do it in shuffleboard where i have access to pucks
// and i can tell whether they are still moving
// let broadcastPoll = false
// export function startBroadcastingPucks () {
// 	broadcastPoll = setInterval()
// }



