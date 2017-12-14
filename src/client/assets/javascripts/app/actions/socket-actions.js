import io from 'socket.io-client'
import {
	updatePucks
} from 'app/actions/shuffleboard-actions'
// const uri = 'https://localhost:8080'
// const uri = window.location.origin
// const uri = `http://${window.location.hostname}:8080`
const uri = 'http://localhost'
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

export const init = (store) => {
	socket = io(uri)
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

	socket.on(BROADCAST_PUCKS, payload => {
		console.log("RECEIVED_PUCKS!")
		store.dispatch(updatePucks(payload))
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

export function broadcastPucks(pucks) {
	emit(BROADCAST_PUCKS, pucks)
}


//IDK if i like the polling done here, id rather do it in shuffleboard where i have access to pucks
// and i can tell whether they are still moving
// let broadcastPoll = false
// export function startBroadcastingPucks () {
// 	broadcastPoll = setInterval()
// }



