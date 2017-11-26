// import {client} from 'websocket'
// const WebSocketClient = require('websocket').client;

// const client = new WebSocketClient();
// const WebSocket = require('ws');
// import WebSocket from 'ws'

// const ws = new WebSocket('ws://localhost:8080');
import io from 'socket.io-client'

const uri = 'http://localhost:8080'
let socket





export const OPEN_GAME_SOCKET = 'OPEN_GAME_SOCKET'
export const CLOSE_GAME_SOCKET = 'CLOSE_GAME_SOCKET'
export const BROADCAST_BOARD_CONFIG = 'BROADCAST_BOARD_CONFIG'
export const RECEIVED_BOARD_CONFIG = 'RECEIVED_BOARD_CONFIG'
export const SET_SOCKET_ID = 'SET_SOCKET_ID'

export const init = (store) => {
	socket = io(uri)
		.on('connect', function() {
			console.log("this.id: ", this.id)
			store.dispatch(setSocketId(this.id))
		})
	//listen here for updates to remote board configs
	socket.on(BROADCAST_BOARD_CONFIG, payload => {
		console.log("ws RECEIVED_BOARD_CONFIG, payload: ", payload)
		store.dispatch(receivedBoardConfig(payload))
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
		dispatch(receivedBoardConfig(config))
	}
}

function receivedBoardConfig(payload) {
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

