import {
	Engine,
	Render,
	Runner,
	Composites,
	Common,
	MouseConstraint,
	Mouse,
	World,
	Bodies,
	Body,
	Events
} from 'matter-js'
import {
	broadcastPucks
} from 'app/actions/socket-actions'
require('images/wood_grain3.jpg')
require('images/wood_grain3_side.jpg')

export const SET_BOARD_DIMENSIONS = 'SET_BOARD_DIMENSIONS'
export const ADD_PUCK = 'ADD_PUCK'
export const UPDATE_PUCKS = 'UPDATE_PUCKS'

export const SHOW_START_GAME_MODAL = 'SHOW_START_GAME_MODAL'
export const SHOW_GAME_OVER_MODAL = 'SHOW_GAME_OVER_MODAL'
// export const CANCEL_MODAL = 'CANCEL_MODAL'
export const ACCEPT_MODAL = 'ACCEPT_MODAL'

export const TEAM_TYPES = {
	RED: 'RED',
	BLUE: 'BLUE'
}

//set variables for suffleboard world
let engine
let world
let renderMatter
let runner
let mouse
let mouseConstraint

function getRenderWidth (device, boardWidth, boardLength) {
	return device.directionY
		? boardWidth
		: boardLength
}

function getRenderHeight (device, boardWidth, boardLength) {
	return device.directionY
		? boardLength
		: boardWidth
}
function getRenderXMin (device, boardWidth, boardLength, lengthOffset) {

	if (device.directionY) {
		return 0
	} else {
		return lengthOffset
	}
}

function getRenderYMin (device, boardWidth, boardLength, lengthOffset) {
	if (device.directionY) {
		return lengthOffset
	} else {
		return 0
	}
}

function getRenderXMax (device, boardWidth, boardLength, lengthOffset) {


	if (device.directionY) {
		return boardWidth
	} else {

		// console.log("getRenderXMax lengthOffset: ", lengthOffset, ", device.width: ", device.width, ", boardLength: ", boardLength)
		return lengthOffset + device.width
	}
}

function getRenderYMax (device, boardWidth, boardLength, lengthOffset) {
	if (device.directionY) {
		return lengthOffset + device.height
	} else {
		return boardWidth
	}
}

function getScoreDimmensions ({
	device,
	index,
	scoreBoxHeight,
	scoreBox,
	boardWidth,
	boardLength
}) {
	let rectX, rectY, rectWidth, rectLength

	if (device.directionY && !device.inverted) {
		rectX = boardWidth / 2
		rectY = (index + 0.5) * scoreBoxHeight
		rectWidth = boardWidth
		rectLength = scoreBoxHeight
	} else if (device.directionY && device.inverted) {
		rectX = boardWidth / 2
		rectY = boardLength - (index + 0.5) * scoreBoxHeight

		console.log("directionY & inverted. rectY: ",rectY)
		rectWidth = boardWidth
		rectLength = scoreBoxHeight
	} else if (!device.directionY && !device.inverted) {
		rectX = (index + 0.5) * scoreBoxHeight
		rectY = boardWidth / 2
		rectWidth = scoreBoxHeight
		rectLength = boardWidth
	} else if (!device.directionY && device.inverted) {
		rectX = boardLength - (index + 0.5) * scoreBoxHeight
		rectY = boardWidth / 2
		rectWidth = scoreBoxHeight
		rectLength = boardWidth
	}

	return [
		rectX,
		rectY,
		rectWidth,
		rectLength
	]
}

function getOppScoreDimmensions ({
	device,
	index,
	scoreBoxHeight,
	scoreBox,
	boardWidth,
	boardLength
}) {
	let rectX, rectY, rectWidth, rectLength

	if (device.directionY && !device.inverted) {
		rectX = boardWidth / 2
		rectY = boardLength - (index + 0.5) * scoreBoxHeight
		rectWidth = boardWidth
		rectLength = scoreBoxHeight
	} else if (device.directionY && device.inverted) {
		rectX = boardWidth / 2
		rectY = (index + 0.5) * scoreBoxHeight
		rectWidth = boardWidth
		rectLength = scoreBoxHeight
	} else if (!device.directionY && !device.inverted) {
		rectX = boardLength - (index + 0.5) * scoreBoxHeight
		rectY = boardWidth / 2
		rectWidth = scoreBoxHeight
		rectLength = boardWidth
	} else if (!device.directionY && device.inverted) {
		rectX = (index + 0.5) * scoreBoxHeight
		rectY = boardWidth / 2
		rectWidth = scoreBoxHeight
		rectLength = boardWidth
	}

	return [
		rectX,
		rectY,
		rectWidth,
		rectLength
	]
}

function createWalls({directionY, boardWidth, boardLength}) {
	const wallHeight = 40
	const wallProps = {
		isStatic: true,
		restitution: 1,
		collisionFilter: {
			mask: 'none' //using right now to set pucks in well
		},
		render: {
			fillStyle: '#222222'
		}
	}
	const walls = directionY
		? [
				Bodies.rectangle(boardWidth - 0.5 * wallHeight, boardLength / 2, wallHeight, boardLength, {
					...wallProps
				}), //RIGHT
				Bodies.rectangle(0.5 * wallHeight, boardLength / 2, wallHeight, boardLength, {
					...wallProps
				}) //left side
			]
		: [
				Bodies.rectangle(boardLength / 2, 0.5 * wallHeight, boardLength, wallHeight, {
					...wallProps
				}), //TOP
				Bodies.rectangle(boardLength / 2, boardWidth - 0.5 * wallHeight, boardLength, wallHeight, {
					...wallProps
				}) //BOTTOM
			]
	return walls
}

function createScoreBoxes({device, boardWidth, boardLength}) {
	//Score boxes
	const scoreBoxProps = {
		isStatic: true,
		collisionFilter: {
			mask: 'none'
		},
		render: {
			strokeStyle: 'rgba(0,0,0,0.2)',
			fillStyle: 'rgba(0,0,0,0)',
			lineWidth: 5
		}
	}

	const oppScoreBoxProps = {
		isStatic: true,
		collisionFilter: {
			mask: 'none'
		},
		render: {
			strokeStyle: 'rgba(0,0,200,0.2)',
			fillStyle: 'rgba(0,0,0,0)',
			lineWidth: 5
		}
	}

	// Score box dimmensions
	const scoreBoxHeight = 100
	const scoreLabels = [null, null, null]
		.map((scoreBox, index) => {
			return Bodies.rectangle(
				...getScoreDimmensions({
					device,
					index,
					scoreBoxHeight,
					scoreBox,
					boardWidth,
					boardLength
				}),
				{
					...scoreBoxProps,
					render: {
						...scoreBoxProps.render,
						sprite: {
							texture: require(`images/number_${3 - index}.png`)
						}
					}
				}
			)
		})
		.map(body => {
			Body.rotate(body, device.directionY ? Math.PI : Math.PI / 2)
			return body
		})
	
	const scoreBoxes = scoreLabels.map((scoreBox, index) => {
		return Bodies.rectangle(
			...getScoreDimmensions({
				device,
				index,
				scoreBoxHeight,
				scoreBox,
				boardWidth,
				boardLength
			}),
			{
				...scoreBoxProps
			}
		)
	})

	const oppScoreLabels = [null, null, null]
		.map((scoreBox, index) => {
			return Bodies.rectangle(
				...getOppScoreDimmensions({
					device,
					index,
					scoreBoxHeight,
					scoreBox,
					boardWidth,
					boardLength
				}),
				{
					...scoreBoxProps,
					render: {
						...scoreBoxProps.render,
						sprite: {
							texture: require(`images/number_${3 - index}.png`)
						}
					}
				}
			)
		})
		.map(body => {
			Body.rotate(body, device.directionY ? 0 : -Math.PI / 2)
			return body
		})
	const oppScoreBoxes = oppScoreLabels.map((scoreBox, index) => {
		return Bodies.rectangle(
				...getOppScoreDimmensions({
					device,
					index,
					scoreBoxHeight,
					scoreBox,
					boardWidth,
					boardLength
				}),
				{
					// ...scoreBoxProps
					...oppScoreBoxProps
				}
			)
	})

	return [
		...scoreLabels,
		...scoreBoxes,
		...oppScoreLabels,
		...oppScoreBoxes
	]
}

function createCanvasStyle({
	device,
	boardWidth,
	boardLength,
	lengthOffset
}) {
	let x
	let y
	let width
	let height

	if (device.directionY && !device.inverted) {
		x = (device.width - boardWidth) / 2
		y = -lengthOffset
		width = boardWidth
		height = boardLength
	} else if (device.directionY && device.inverted) {
		x = (device.width - boardWidth) / 2
		y = -lengthOffset //????
		width = boardWidth
		height = boardLength
	} else if (!device.directionY && !device.inverted) {
		x = -lengthOffset
		y = (device.height - boardWidth) / 2
		width = boardLength
		height = boardWidth
	} else if (!device.directionY && device.inverted) {
		x = -lengthOffset //???
		y = (device.height - boardWidth) / 2
		width = boardLength
		height = boardWidth
	}
	return `\
		transform: translate(\
			${x}px,\
			${y}px\
		);\
		width: ${width}px;\
		height: ${height}px;`
}


export function initBoard(shuffleboardCanvas) {
	return (dispatch, getState) => {
		const {
			boardConfig: {devices={}, socketId, pucks}
		} = getState()
		const device = devices[socketId] || {}
		const boardWidth = getBoardWidth(devices)
		const boardLength = getBoardLength(devices)
		const lengthOffset = getLengthOffset(socketId, devices)

		engine = Engine.create()
		world = engine.world
		renderMatter = Render.create({
			element: shuffleboardCanvas,
			engine: engine,
			options: {
				width: getRenderWidth(device, boardWidth, boardLength),
				height: getRenderHeight(device, boardWidth, boardLength),
				showAngleIndicator: false,
				pixelRatio: 1,
				background: 'rgba(0,0,0,0)',
				wireframeBackground: '#222',
				hasBounds: false,
				enabled: true,
				wireframes: false,
				showShadows: true
			}
		})

		world.gravity.y = 0

		Render.run(renderMatter)

		runner = Runner.create()
		Runner.run(runner, engine)

		//add score boxes
		const scoreBoxes = createScoreBoxes({
			device,
			boardWidth,
			boardLength
		})

		World.add(world, scoreBoxes)

		//add walls
		const walls = createWalls({
			directionY: device.directionY,
			boardWidth,
			boardLength
		})

		World.add(world, walls)


		// add mouse control
		mouse = Mouse.create(renderMatter.canvas)
		mouseConstraint = MouseConstraint.create(engine, {
				mouse: mouse,
				constraint: {
						stiffness: 0.2,
						render: {
								visible: false
						}
				}
		});

		World.add(world, mouseConstraint);

		// keep the mouse in sync with rendering
		renderMatter.mouse = mouse;

		let isListening = false
		const pollInterval = 500

		//TODO: change board to active when current turn's ball is in frame
		Events.on(mouseConstraint, "mousedown", (e) => {
			isListening = true
			
			//TODO: need to clean this up on component received props - look for updates to pucks to 
			if (broadcastPoll) {
				clearInterval(broadcastPoll)
			}
			broadcastPoll = setInterval(() => {
				// console.log("broadcastPoll called")

				//TODO: check if balls are moving, if not, clear interval
				const boardIsActive = isBoardActive(pucks)

				if (!boardIsActive) {
					console.log("board is no longer active, clearing Interval")
					clearInterval(broadcastPoll)
					return
				}
				if (pucks) {
					const nextPucks = generatePuckMessage(pucks, device)

					broadcastPucks(nextPucks, device)
				}
			}, pollInterval)
			console.log("mousedown, should fire action ")

		})
		Events.on(mouseConstraint, "mousemove", (e) => {
			// console.log("mousemove e: ", e.source.mouse)
			//TODO: here broadcase all puck positions and velocities

			if (pucks && isListening) {
				const nextPucks = generatePuckMessage(pucks, device)

				broadcastPucks(nextPucks, device)
			}

		})
		Events.on(mouseConstraint, "mouseup", (e) => {
			isListening = false
		})

		// fit the render viewport to the scene
		Render.lookAt(renderMatter, {
				min: {
					x: 0,
					y: 0
				},
				max: {
					x: getRenderWidth(device, boardWidth, boardLength),
					y: getRenderHeight(device, boardWidth, boardLength)
				}
		});

		console.log("lengthOffset: ", lengthOffset)

		shuffleboardCanvas.style = createCanvasStyle({
			device,
			boardWidth,
			boardLength,
			lengthOffset,
			pucks
		})
	}
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

export function isBoardActive (pucks = []) {
	//TODO: should also consider if a puck has left the board area
	return pucks.reduce((isActive, puck) => {
		if (isActive) {
			return isActive
		}

		return (Math.abs(puck.velocity.x) + Math.abs(puck.velocity.y)) > 0.01
	}, false)
}

export function updatePucks (pucks) {
	// return {
	// 	type: UPDATE_PUCKS,
	// 	pucks
	// }

	return (dispatch, getState) => {
		const {boardConfig: {devices, socketId}} = getState()
		const device = devices[socketId]

		console.log("updatePucks called, devices: ", devices)
		console.log("device: ", device)
		return {
			type: UPDATE_PUCKS,
			pucks: puckMessageToState(pucks, devices)
		}
	}
}

export function generatePuckMessage(pucks = [], device) {
	//NOTE: will need to transform everything depending on device.directionY

	return pucks.map(puck => {
		return {
			angle: puck.angle,
			position: puck.position,
			velocity: puck.velocity
		}
	})
}

//NOTE: these two methods should be in socket-actions
export function puckStateToMessage (pucks, device) {
	const wallHeight = 40
	//transform pucks to broadcast in the correct (directionY) orientation
	// console.log("puckStateToMessage pucks: ", pucks, ", device: ", device)
	// console.log("first puck position IN STATE x: ", pucks[0].position.x, ", y: ", pucks[0].position.y)
	return pucks.map(puck => {
		let angle = puck.angle
		let position = puck.position
		let velocity = puck.velocity

		// console.log("angle: ", angle, ", position: ", position, ", velocity: ", velocity)
		//add 90deg if !directionY
		if (!device.directionY) {
			angle += Math.PI / 2

			// Swapping x and y position is fucked 
				// either becuase I have to account for gutter, boardWidth and boardLength
				// or for some other reason
			//swap x and y
			const tempP = position.x
			const tempV = velocity.x
			// position.x = position.y
			// position.y = tempP

			// console.log("swapped position: ", position)

			velocity.x = velocity.y
			velocity.y = tempV
			//TODO: position and velocity
		}

		// //subtract 180deg if inverted
		// if (device.inverted) {
		// 	angle -= Math.PI

		// 	if (device.directionY) {
		// 		position.y = boardLength - position.y
		// 		velocity.y = -velocity.y
		// 	} else {
		// 		position.x = boardLength - position.x
		// 		velocity.x = -velocity.x
		// 	}
		// }

		return {
			angle,
			position,
			velocity
		}
	})
}

export function puckMessageToState (pucks, device) {
	const wallHeight = 40

	console.log("RECEIVED first puck position x: ", pucks[0].position.x, ", y: ", pucks[0].position.y)

	//Convert pucks from message to device orientation
	// console.log("puckMessageToState pucks: ", pucks, ", device: ", device)
	return pucks.map(puck => {
		let angle = puck.angle
		let position = puck.position
		let velocity = puck.velocity

		if (!device.directionY) {
			angle -= Math.PI / 2

			//swap x and y
			const tempP = position.x
			const tempV = velocity.x
			//WHy doesnt this work
			// position.x = position.y
			// position.y = tempP

			velocity.x = velocity.y
			velocity.y = tempV
		}
		// if (device.inverted) {
		// 	angle += Math.PI

		// 	if (device.directionY) {
		// 		position.y = boardLength - position.y
		// 		velocity.y = -velocity.y
		// 	} else {
		// 		position.x = boardLength - position.x
		// 		velocity.x = -velocity.x
		// 	}
		// }

		return {
			angle,
			position,
			velocity
		}
	})
}

export function getScoreFromPucks(pucks, devices, socketId) {
	const device = devices[socketId]
	const boardLength = getBoardLength(devices)
	const scoreBoxHeight = 100
	// let redPuckCount = 0
	// let bluePuckCount = 0
	let redScore = 0
	let blueScore = 0

	pucks.forEach(puck => {
		// if (puck.team === TEAM_TYPES.RED) {
		// 	++redPuckCount
		// } else if (puck.team === TEAM_TYPES.BLUE) {
		// 	++bluePuckCount
		// }

		if (!isTurnInProgress && puck.velocity.x )
		if (device.directionY) {
			if (!device.inverted) {
				if (puck.position.x > boardLength) {
					//dont count
				} else if (puck.position.x > (boardLength - scoreBoxHeight)) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 3
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 3
					}
				} else if (puck.position.x > (boardLength - 2 * scoreBoxHeight)) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 2
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 2
					}
				} else if (puck.position.x > (boardLength - 3 * scoreBoxHeight)) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 1
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 1
					}
				}
			} else {
				if (puck.position.x < 0) {
					//dont count
				} else if (puck.position.x < scoreBoxHeight) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 3
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 3
					}
				} else if (puck.position.x < 2 * scoreBoxHeight) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 2
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 2
					}
				} else if (puck.position.x < 3 * scoreBoxHeight) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 1
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 1
					}
				}
			}
		} else {
			if (!device.inverted) {
				if (puck.position.y > boardLength) {
					//dont count
				} else if (puck.position.y > (boardLength - scoreBoxHeight)) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 3
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 3
					}
				} else if (puck.position.y > (boardLength - 2 * scoreBoxHeight)) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 2
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 2
					}
				} else if (puck.position.y > (boardLength - 3 * scoreBoxHeight)) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 1
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 1
					}
				}
			} else {
				if (puck.position.y < 0) {
					//dont count
				} else if (puck.position.y < scoreBoxHeight) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 3
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 3
					}
				} else if (puck.position.y < 2 * scoreBoxHeight) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 2
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 2
					}
				} else if (puck.position.y < 3 * scoreBoxHeight) {
					if (puck.team === TEAM_TYPES.RED) {
						redScore += 1
					} else if (puck.team === TEAM_TYPES.BLUE) {
						blueScore += 1
					}
				}
			}
		}
	})

	return {
		red: redScore,
		blue: blueScore
	}

}

export function getGameState() {
	return (dispatch, getState) => {
		const {
			boradConfig: {pucks, devices, socketId}
		} = getState()
		let redPuckCount = 0
		let bluePuckCount = 0

		//TODO: set values based on pucks
		//TODO: calculate score based on puck positions relative to the board dimmensions
			//NOTE: this could spell trouble when puck positions are normalized
		pucks.forEach(puck => {
			if (puck.team === TEAM_TYPES.RED) {
				++redPuckCount
			} else if (puck.team === TEAM_TYPES.BLUE) {
				++bluePuckCount
			}
		})

		return {
			score: getScoreFromPucks(pucks, devices, socketId), //{red: 4, blue: 1}
			isRedsTurn: redPuckCount <= bluePuckCount,
			isTurnInProgress: isBoardActive(pucks), //This is not completely accurate b/c pucks are not moving at beginning of turn
			isGameOver: redPuckCount + bluePuckCount === 8
		}
	}
}
 

 //here 
export function showStartGameModal(world) {
	//set message title and content in state, but how to handle modal action btns?
	// ok button will add puck to board
	return {
		type: SHOW_START_GAME_MODAL
	}
}

export function showGameOverModal(winningTeam) {
	return {
		type: SHOW_GAME_OVER_MODAL,
		team: winningTeam
	}
}

// export cancelModal() {
// 	return {
// 		type: CANCEL_MODAL
// 	}
// }

export function acceptModal() {
	return {
		type: ACCEPT_MODAL
	}
}