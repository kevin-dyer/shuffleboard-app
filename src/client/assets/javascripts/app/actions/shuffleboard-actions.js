export const SET_BOARD_DIMENSIONS = 'SET_BOARD_DIMENSIONS'
export const ADD_PUCK = 'ADD_PUCK'
export const UPDATE_PUCKS = 'UPDATE_PUCKS'

export const TEAM_TYPES = {
	RED: 'RED',
	BLUE: 'BLUE'
}

export function startTurn () {
	return (dispatch, getState) => {
		const {
			boardConfig: {
				pucks,
				devices
			}
		} = getState()
		const boardWidth = getBoardWidth(devices)
		const boardLength = getBoardLength(devices)

		console.log("boardWidth: ", boardWidth, ", boardLength: ", boardLength)
		const padding = 50
		const team = pucks.length % 2
			? TEAM_TYPES.BLUE
			: TEAM_TYPES.RED 
		const puck = {
			id: `${team}${pucks.length}`,
			team,
			x: boardWidth / 2,
			y: team === TEAM_TYPES.RED
				? padding
				: boardLength - padding,
			vx: 0,
			vy: 0
		}
		return dispatch({
			type: ADD_PUCK,
			puck
		})
	}
	//TODO: create puck - create id
}

export function getBoardLength (devices) {
	return Object.values(devices).reduce((length, nextDevice) => {
		return length + (nextDevice.directionY ? nextDevice.height : nextDevice.width)
	}, 0)
}

export function getBoardWidth (devices) {
	return Object.values(devices).reduce((width, nextDevice) => {
		if (nextDevice.directionY) {
			return nextDevice.width < width
				? nextDevice.width
				: width
		} else {
			return nextDevice.height < width
				? nextDevice.height
				: width
		}
	}, Infinity)
}

export function getLengthOffset (socketId, devices) {
	const device = devices[socketId]

	return Object.values(devices)
		.filter(dev => {
			if (!device.inverted) {
				return dev &&
					dev.timestamp &&
					parseInt(dev.timestamp) < parseInt(device.timestamp)
			} else {
				return dev &&
					dev.timestamp &&
					parseInt(dev.timestamp) > parseInt(device.timestamp)
			}
		})
		.reduce((offset, nextDevice) => {
			return offset + (nextDevice.directionY ? nextDevice.height : nextDevice.width)
		},0)
}

export function updatePucks (pucks) {
	return {
		type: UPDATE_PUCKS,
		pucks
	}
}