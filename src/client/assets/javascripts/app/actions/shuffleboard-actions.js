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
	broadcastPucks,
	// broadcastTurnStarted
	broadcastMouseDown,
	broadcastMouseUp,
	broadcastAcceptModal
} from 'app/actions/socket-actions'
require('images/wood_grain3.jpg')
require('images/wood_grain3_side.jpg')
import _ from 'underscore'

export const SET_BOARD_DIMENSIONS = 'SET_BOARD_DIMENSIONS'
export const ADD_PUCK = 'ADD_PUCK'
export const UPDATE_PUCKS = 'UPDATE_PUCKS'

export const SHOW_START_GAME_MODAL = 'SHOW_START_GAME_MODAL'
export const SHOW_GAME_OVER_MODAL = 'SHOW_GAME_OVER_MODAL'
// export const CANCEL_MODAL = 'CANCEL_MODAL'
export const ACCEPT_MODAL = 'ACCEPT_MODAL'
export const SHOW_NEXT_TURN_MODAL = 'SHOW_NEXT_TURN_MODAL'

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
let puckElements = []
let broadcastPoll
const wallHeight = 40
const scoreBoxHeight = 100
const puckRad = 35
let isMouseDown = false
const pollInterval = 50
let lastBroadcaster


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

		// console.log("directionY & inverted. rectY: ",rectY)
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
	const scoreLabels = [null, null, null]
		.map((scoreBox, index) => {
			return Bodies.rectangle(
				...getScoreDimmensions({
					device,
					index,
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
			boardConfig: {
				devices={},
				socketId
				// pucks
			}
		} = getState()
		const device = devices[socketId] || {}
		const boardWidth = getBoardWidth(devices)
		const boardLength = getBoardLength(devices)
		const lengthOffset = getLengthOffset(socketId, devices)
		const sortedDevices = sortDevices(devices)

		let pucks = [] //TODO: update on events

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


		


		//TODO: change board to active when current turn's ball is in frame
			// can broadcast from throttled on puck move
			// only events available for body is sleepEnd and sleepStart - will need to poll in between
		//BIG NOTE: Only turn on if its the first device

		// add mouse control to first device
		if (sortedDevices[0] === device) {
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

			Events.on(mouseConstraint, "mousedown", (e) => {
				//NOTE: that this should fire action to broadcast to rest of devices to start polling
				mouseDown()
				broadcastMouseDown()
				// This should be fired to start polling self (NOTE: make sure the broadcast doesnt come back)
				dispatch(startPollingPucks())
			})

			Events.on(mouseConstraint, "mouseup", (e) => {
				mouseUp()

				broadcastMouseUp()
			})
		}

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

		// Sets the pixel ratio of the renderer and updates the canvas. To automatically detect the correct ratio, pass the string 'auto' for pixelRatio.
		Render.setPixelRatio(renderMatter, 'auto')

		shuffleboardCanvas.style = createCanvasStyle({
			device,
			boardWidth,
			boardLength,
			lengthOffset,
			pucks
		})
	}
}

export function mouseDown() {
	isMouseDown = true
}

export function mouseUp() {
	isMouseDown = false
}

//TODO: this should determine puck type to add from game state,
// and actually add the puck to the world
export function startTurn () {
	return (dispatch, getState) => {
		const {
			boardConfig: {
				pucks,
				devices={},
				socketId
			}
		} = getState()
		const device = devices[socketId]
		const boardWidth = getBoardWidth(devices)
		const boardLength = getBoardLength(devices)
		const {isRedsTurn} = dispatch(getGameState())
		
		// console.log("boardWidth: ", boardWidth, ", boardLength: ", boardLength)
		const padding = 50
		const team = isRedsTurn
			? TEAM_TYPES.RED
			: TEAM_TYPES.BLUE

		//NOTE: position should be independent of device position
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
		
		dispatch({
			type: ADD_PUCK,
			puck
		})

		//add puck to board - note the x and y should be transformed from the state puck.x and y
		let x, y
		if (device.directionY && !device.inverted) {
			x = boardWidth / 2
			y = 1.5 * puckRad
		} else if (device.directionY && device.inverted) {
			x = boardWidth / 2
			y = boardLength - (1.5 * puckRad)
		} else if (!device.directionY && !device.inverted) {
			x = 1.5 * puckRad
			y = boardWidth / 2
		} else if (!device.directionY && device.inverted) {
			x = boardLength - 1.5 * puckRad
			y = boardWidth / 2
		}

		//TODO: need to add listeners for determining when puck is out of bounds or stopped
		let nextPuck = Bodies.circle(x, y, puckRad, {
			frictionAir: 0.03,
			restitution: 0.9,
			render: {
        sprite: {
          texture: isRedsTurn 
          	? require('images/red_puck.png')
          	: require('images/black_puck.png')
        }
      },
      label: team,
      torque: 0.4
		})

		//To keep track of puck elements
		puckElements = [...puckElements, nextPuck]

		World.add(world, nextPuck)
	}
}

//TODO: call this on action fired from mouse down
// on mouse down, should broadcast message
	// this message should cause all devices to fire startPollingPucks
export function startPollingPucks () {
	return (dispatch, getState) => {
		const {boardConfig: {socketId, devices}} = getState()
		const device = devices[socketId]

		stopPollingPucks()

		broadcastPoll = setInterval(() => {
			// console.log("broadcastPoll called")

			//TODO: check if balls are moving, if not and mouse is not down, clear interval and complete turn
			const boardIsActive = isBoardActive(puckElements)

			if (!boardIsActive && !isMouseDown) {
				stopPollingPucks()

				const gameState = dispatch(getGameState())

				// console.log("gameState: ", gameState)

				//TODO: broadcast turn complete
				if (!gameState.isGameOver) {
					dispatch(showNextTurnModal(gameState))
				} else {
					dispatch(showGameOverModal(gameState))
				}

				return
			}

			//Note: Only broadcast here if current puck is diplayed on current device
			if (puckElements && puckElements.length > 0) {

				const currentPuck = puckElements[puckElements.length - 1]
				//check if location of puck is inside device
				// const deviceHasPuck = isPuckOnDevice(currentPuck, socketId, devices)
				const broadcastDevice = getBroadcastDevice(currentPuck, devices, socketId)

				console.log("broadcastDevice id: ", broadcastDevice.id, ", socketId: ", socketId)
				if (broadcastDevice === device) {
					// console.log("this is broadcastDevice")
					// console.log("deviceHasPuck! socketId: ", socketId, ", devices: ", devices)
					const nextPucks = generatePuckMessage(puckElements, device)

					broadcastPucks(nextPucks, device, devices)
				}
			}
		}, pollInterval)
	}
}

//TODO: call this at the end of the turn when puck has stopped moving
export function stopPollingPucks() {
	if (broadcastPoll) {
		console.log("clearing interval broadcastPoll")
		clearInterval(broadcastPoll)
	}
}


function getBroadcastDevice(puck, devices, socketId) {
	const currentDevice = devices[socketId]
	const boardWidth = getBoardWidth(devices)
	const boardLength = getBoardLength(devices)

	// console.log("getBoadcastDevice devices: ", devices, ", puck.position: ", puck.position) //TODO: make sure all devices and pucks are present
	for(let deviceKey in devices) {

		// console.log("deviceKey: ", deviceKey)
		const device = devices[deviceKey]
		const lengthOffset = getLengthOffset(deviceKey, devices)
		const {x: devX, y: devY} = puck.position
		let isOnDevice

		

		//maybe the directionY only matters for the actual device, not the one in the loop
		// maybe it matters the direction of both - be cuase the loop device directionY is necessary to device wich to use, device.height or device.width
		

		if (currentDevice.directionY) {
			isOnDevice = (
				(devX >= wallHeight && devX <= (boardWidth - wallHeight)) && 
				(devY >= lengthOffset && devY <= (lengthOffset + (device.directionY ? device.height : device.width)))
			)

			// if (device.directionY) {
			// 	console.log("lengthOffset: ", lengthOffset, ", device.height: ", device.height, ", puck.position.y: ", puck.position.y, ", device.id: ", device.id, ", isOnDevice: ", isOnDevice)
			// 	console.log("1: ", devX >= wallHeight, ", 2: ", devX <= (boardWidth - wallHeight), ", 3: ", devY >= lengthOffset, ", 4: ", devY <= (lengthOffset + (device.directionY ? device.height : device.width)))
			// 	console.log("devY: ", devY, ", device.directionY: ", device.directionY)
			// }

		} else {
			isOnDevice = (
				(devY >= wallHeight && devY <= (boardWidth - wallHeight)) &&
				(devX >= lengthOffset && devX <= (lengthOffset + (device.directionY ? device.width : device.height)))
			)

			

			// console.log("1: ", devY >= wallHeight, ", 2: ", devY <= (boardWidth - wallHeight), ", 3: ", devX >= lengthOffset, ", 4: ", devX <= (lengthOffset + device.width), ", isOnDevice: ", isOnDevice)
		}

		// console.log("isOnDevice ", deviceKey,": ", isOnDevice, ", lengthOffset: ", lengthOffset)
		console.log("lengthOffset: ", lengthOffset, ", device.width: ", device.width, ", puck.position.x: ", puck.position.x, ", device.id: ", device.id, ", isOnDevice: ", isOnDevice)
		if (isOnDevice) {
			lastBroadcaster = device
			
			// console.log("getBroadcastDevice returning device: ", device.id)
			return device
		}
	}

	return lastBroadcaster
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

export function sortDevices (devices) {
	return _.sortBy(Object.values(devices), dev => {
			return dev &&
				dev.timestamp &&
				parseInt(dev.timestamp)
		})
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
		//NOTE: let socket-actions do the transforms
		// const nextPucks = puckMessageToState(pucks, device)

		// console.log("updatePucks called, devices: ", devices)
		// console.log("device: ", device)

		//update puckElements
		puckElements.forEach((puck, index) => {
			// console.log("updating Body to puck: ", puck, ", pucks[index]: ", pucks[index])

			//BIG TODO: Need to convert the incoming pucks to board config
			Body.setAngle(puck, pucks[index].angle)
			Body.setPosition(puck, pucks[index].position)
			Body.setVelocity(puck, pucks[index].velocity)
		})

		return {
			type: UPDATE_PUCKS,
			pucks
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
export function puckStateToMessage (pucks, device, devices) {
	const boardWidth = getBoardWidth(devices)
	//transform pucks to broadcast in the correct (directionY) orientation
	// console.log("puckStateToMessage pucks: ", pucks, ", device: ", device)
	// console.log("first puck position IN STATE x: ", pucks[0].position.x, ", y: ", pucks[0].position.y)
	return pucks.map(puck => {
		let angle = puck.angle
		let position = {...puck.position}
		let velocity = {...puck.velocity}

		// console.log("angle: ", angle, ", position: ", position, ", velocity: ", velocity)
		//add 90deg if !directionY
		if (!device.directionY) {
			angle -= Math.PI / 2

			// Swapping x and y position is fucked 
				// either becuase I have to account for gutter, boardWidth and boardLength
				// or for some other reason
			//swap x and y
			const tempPX = position.x
			const tempVX = velocity.x
			position.x = boardWidth - position.y
			position.y = tempPX

			// console.log("swapped position: ", position)

			velocity.x = velocity.y
			velocity.y = tempVX
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

export function puckMessageToState (pucks, device, devices) {
	const boardWidth = getBoardWidth(devices)
	// console.log("RECEIVED first puck position x: ", pucks[0].position.x, ", y: ", pucks[0].position.y)

	//Convert pucks from message to device orientation
	// console.log("puckMessageToState pucks: ", pucks, ", device: ", device)
	return pucks.map(puck => {
		let angle = puck.angle
		let position = {...puck.position}
		let velocity = {...puck.velocity}

		if (!device.directionY) {
			angle += Math.PI / 2

			//swap x and y
			const tempPX = position.x
			const tempV = velocity.x
			//WHy doesnt this work
			position.x = position.y
			position.y = boardWidth - tempPX

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

export function getScoreFromPucks(pucks=[], devices={}, socketId) {
	const device = devices[socketId]
	const boardLength = getBoardLength(devices)
	const boardWidth = getBoardWidth(devices)
	let redScore = 0
	let blueScore = 0

	//NOTE: these are puckElements
	pucks.forEach(puck => {
		if (device.directionY && puck.position.x > wallHeight && puck.position.x < (boardWidth - wallHeight)) {
			if (!device.inverted) {
				if (puck.position.y > boardLength) {
					//dont count
				} else if (puck.position.y > (boardLength - scoreBoxHeight)) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 3
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 3
					}
				} else if (puck.position.y > (boardLength - 2 * scoreBoxHeight)) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 2
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 2
					}
				} else if (puck.position.y > (boardLength - 3 * scoreBoxHeight)) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 1
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 1
					}
				}
			} else {
				if (puck.position.y < 0) {
					//dont count
				} else if (puck.position.y < scoreBoxHeight) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 3
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 3
					}
				} else if (puck.position.y < 2 * scoreBoxHeight) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 2
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 2
					}
				} else if (puck.position.y < 3 * scoreBoxHeight) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 1
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 1
					}
				}
			}
		} else if (puck.position.y > wallHeight && puck.position.y < (boardWidth - wallHeight)) {
			if (!device.inverted) {
				if (puck.position.x > boardLength) {
					//dont count
				} else if (puck.position.x > (boardLength - scoreBoxHeight)) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 3
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 3
					}
				} else if (puck.position.x > (boardLength - 2 * scoreBoxHeight)) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 2
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 2
					}
				} else if (puck.position.x > (boardLength - 3 * scoreBoxHeight)) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 1
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 1
					}
				}
			} else {
				if (puck.position.x < 0) {
					//dont count
				} else if (puck.position.x < scoreBoxHeight) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 3
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 3
					}
				} else if (puck.position.x < 2 * scoreBoxHeight) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 2
					} else if (puck.label === TEAM_TYPES.BLUE) {
						blueScore += 2
					}
				} else if (puck.position.x < 3 * scoreBoxHeight) {
					if (puck.label === TEAM_TYPES.RED) {
						redScore += 1
					} else if (puck.label === TEAM_TYPES.BLUE) {
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
			boardConfig: {
				pucks=[],
				devices={},
				socketId
			}
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

		// console.log("redPuckCount: ", redPuckCount, ", bluePuckCount: ", bluePuckCount, ", isRedsTurn: ", redPuckCount <= bluePuckCount)

		return {
			score: getScoreFromPucks(puckElements, devices, socketId), //{red: 4, blue: 1}
			isRedsTurn: redPuckCount <= bluePuckCount,
			isTurnInProgress: isBoardActive(puckElements), //This is not completely accurate b/c pucks are not moving at beginning of turn
			isGameOver: redPuckCount + bluePuckCount === 8
		}
	}
}
 

 //here 
export function showStartGameModal() {
	//set message title and content in state, but how to handle modal action btns?
	// ok button will add puck to board
	return {
		type: SHOW_START_GAME_MODAL
	}
}

export function showNextTurnModal({score, isRedsTurn}) {
	return {
		type: SHOW_NEXT_TURN_MODAL,
		score,
		isRedsTurn
	}
}

//TODO: update reducer
export function showGameOverModal({score}) {
	return {
		type: SHOW_GAME_OVER_MODAL,
		score
	}
}

// export cancelModal() {
// 	return {
// 		type: CANCEL_MODAL
// 	}
// }

export function acceptModal() {
	broadcastAcceptModal()
	return {
		type: ACCEPT_MODAL
	}
}