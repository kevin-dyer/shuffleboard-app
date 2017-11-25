import {client} from 'websocket'



export const OPEN_GAME_SOCKET = 'OPEN_GAME_SOCKET'
export const CLOSE_GAME_SOCKET = 'CLOSE_GAME_SOCKET'
export const BROADCAST_BOARD_CONFIG = 'BROADCAST_BOARD_CONFIG'

console.log("client: ", client)
export function openGameSocket() {
	//open websocket here

}

export function closeGameSocket() {
	//close ws here
}

export function broadcastConfig(config) {
	return (dispatch, getState) => {
		//send message over config ws
		//set type=BOARD_CONFIG		
	}
}