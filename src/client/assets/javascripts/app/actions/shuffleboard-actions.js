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
import mouseDownSoundSrc from 'audio/shuffleboard_mousedown.mp3'
import throwSoundSrc from 'audio/shuffleboard_throw.mp3'
import gutterSoundSrc from 'audio/shuffleboard_gutter.mp3'
import _ from 'underscore'


export const SET_BOARD_DIMENSIONS = 'SET_BOARD_DIMENSIONS'
export const ADD_PUCK = 'ADD_PUCK'
export const UPDATE_PUCKS = 'UPDATE_PUCKS'

export const SHOW_START_GAME_MODAL = 'SHOW_START_GAME_MODAL'
export const SHOW_GAME_OVER_MODAL = 'SHOW_GAME_OVER_MODAL'
// export const CANCEL_MODAL = 'CANCEL_MODAL'
export const ACCEPT_MODAL = 'ACCEPT_MODAL'
export const SHOW_NEXT_TURN_MODAL = 'SHOW_NEXT_TURN_MODAL'
export const SHOW_ORIENTATION_MODAL = 'SHOW_ORIENTATION_MODAL'
// export const SHOW_ALLOW_JOIN_MODAL = 'SHOW_ALLOW_JOIN_MODAL'

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
let mouseDownSound
let throwSound
let gutterSound
let canvasElement
let hasInitializedAudio = false
let puckInGutter = false //for firing gutter sound only once


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
		y = -(boardLength - device.height - lengthOffset)

		width = boardWidth
		height = boardLength
	} else if (!device.directionY && !device.inverted) {
		x = -lengthOffset
		y = (device.height - boardWidth) / 2
		width = boardLength
		height = boardWidth
	} else if (!device.directionY && device.inverted) {
		x = -(boardLength - device.width - lengthOffset)
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

		canvasElement = shuffleboardCanvas

		//TODO: consider adjusting the puckRad based on boardWidth
		console.log("puckRad/boardWidth ratio: ", Math.floor(puckRad / boardWidth * 100) / 100, ", should be 0.105")
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

		//Initialize sounds
		mouseDownSound = new Sound(mouseDownSoundSrc)
		throwSound = new Sound(throwSoundSrc)
		gutterSound = new Sound(gutterSoundSrc)

		console.log("initialized sounds")


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

				//fire the mouse down sound and stop throwSound
				throwSound.stop()
				mouseDownSound.play()

				// canvasElement.style.border = '5px solid red'
				// } else {
				// 	canvasElement.style.border = 'none'
				// }

			})

			Events.on(mouseConstraint, "mouseup", (e) => {
				mouseUp()

				//NOTE: need this to fire throwSound on other devices
				//this will come into socket-actions - so how can i fire something here?
				broadcastMouseUp()

				// canvasElement.style.border = 'none'
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

		// Sets the pixel ratio of the renderer and updates the canvas.
		// To automatically detect the correct ratio, pass the string 'auto' for pixelRatio.
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

	//NOTE: not playing the mouseDown sound here,
	//because I only want the first device to play the mousedown sound
}

export function mouseUp() {
	isMouseDown = false

	throwSound.stop()
	throwSound.play()
}

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


		puckInGutter = false
		console.log("startTurn called!")
		
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
			// TODO: should check if puck is in bounds

			//check if balls are moving, if not and mouse is not down, clear interval and complete turn
			const boardIsActive = isBoardActive(puckElements)

			if (!boardIsActive && !isMouseDown) {
				stopPollingPucks()
				updatePuckCollisions(device, devices)

				const gameState = dispatch(getGameState())

				// console.log("gameState: ", gameState)

				//TODO: broadcast turn complete
				if (!gameState.isGameOver) {
					dispatch(showNextTurnModal(gameState))
				} else {
					dispatch(showGameOverModal(gameState))
				}

				//TODO: stop the throw sound
				throwSound.stop()
				// stopSoundListeners()
				return
			}

			//Note: Only broadcast here if current puck is diplayed on current device
			if (puckElements && puckElements.length > 0) {

				const currentPuck = puckElements[puckElements.length - 1]
				//check if location of puck is inside device
				const broadcastDevice = getBroadcastDevice(currentPuck, devices, socketId)

				if (broadcastDevice === device) {
					// console.log("this is broadcastDevice")
					const nextPucks = generatePuckMessage(puckElements, device)

					broadcastPucks(nextPucks, device, devices)

					//TODO: for test - update style when is broadcastDevice
					// canvasElement.style.border = '2px solid red'
				} else {
					// canvasElement.style.border = 'none'
				}

				//Adjust the throwSound volume based on currentPuck
				const speed = Math.floor(currentPuck.speed * 100) / 100
				let nextVol = speed > 1 ? 1 : speed
				// console.log("nextVol: ", nextVol)

				throwSound.volume(nextVol)

				//stop turn and activate gutter sound when puck is out of bounds
				const isPuckInBounds = isPuckOnBoard(currentPuck, device, devices)
				if (!isPuckInBounds) {
					//stop the throw sound
					throwSound.stop()

					//play gutter sound only once per turn (if puck is in gutter)
					if (!puckInGutter) {
						puckInGutter = true
						//play the gutter sound at half the volume
						gutterSound.volume(nextVol / 2)
						gutterSound.play()
					}



					//instead of ending turn immediately, just stop the puck from moving, or slow down lots
					//let the above conditional end the game
					Body.setVelocity(currentPuck, {
						x: 0.75 * currentPuck.velocity.x,
						y: 0.75 * currentPuck.velocity.y
					})

					return
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

//change collision filter for pucks that are off board (so they dont interfear with in play pucks)
function updatePuckCollisions(device, devices) {
	const OUTOFBOUNDS = 'OUTOFBOUNDS'

	puckElements.forEach(puck => {
		if (puck.collisionFilter.group !== OUTOFBOUNDS && !isPuckOnBoard(puck, device, devices)) {
			puck.collisionFilter = {
				mask: 'none',
				group: 'outofbounds'
			}
			puck.render.opacity = 0.4
		}
	})
}

function isPuckOnBoard(puck, currentDevice, devices) {
	const boardWidth = getBoardWidth(devices)
	const boardLength = getBoardLength(devices)
	const [stdPuck, ...stdPucks] = puckStateToMessage([puck], currentDevice, devices)
	const {x: devX, y: devY} = stdPuck.position
	
	return (
		(devX >= wallHeight && devX <= (boardWidth - wallHeight)) && 
		(devY >= 0 && devY <= boardLength)
	)
} 



function getBroadcastDevice(puck, devices, socketId) {
	const currentDevice = devices[socketId]
	const boardWidth = getBoardWidth(devices)
	const boardLength = getBoardLength(devices)
	const [stdPuck] = puckStateToMessage([puck], currentDevice, devices)
	let {x: devX, y: devY} = stdPuck.position

	for (let deviceKey in devices) {
		const device = devices[deviceKey]
		const lengthOffset = getLengthOffset(deviceKey, devices)
		const deviceLength = device.directionY ? device.height : device.width
		let isOnDevice = (
			(devX >= wallHeight && devX <= (boardWidth - wallHeight)) &&
			(devY >= lengthOffset && devY <= (lengthOffset + deviceLength))
		)

		if (isOnDevice) {
			lastBroadcaster = device
			return device
		}
	}

	//return lastBroadcaster if puck is completely off board
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
			return dev &&
				dev.timestamp &&
				parseInt(dev.timestamp) < parseInt(device.timestamp)
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
	const boardLength = getBoardLength(devices)
	//transform pucks to broadcast in the correct (directionY) orientation
	// console.log("puckStateToMessage pucks: ", pucks, ", device: ", device)
	// console.log("first puck position IN STATE x: ", pucks[0].position.x, ", y: ", pucks[0].position.y)
	return pucks.map(puck => {
		let angle = puck.angle
		let position = {...puck.position}
		let velocity = {...puck.velocity}

		//add 90deg if !directionY
		if (!device.directionY) {
			angle -= Math.PI / 2

			//swap x and y
			const tempPX = position.x
			const tempVX = velocity.x
			position.x = boardWidth - position.y
			position.y = tempPX

			velocity.x = -velocity.y
			velocity.y = tempVX
		}

		if (device.inverted) {
			angle += Math.PI
			velocity.x = -velocity.x
			velocity.y = -velocity.y

			if (device.directionY) {
				position.x = boardWidth - position.x
				position.y = boardLength - position.y
			} else {
				position.x = boardWidth - position.x
				position.y = boardLength - position.y
			}
		}

		return {
			label: puck.label,
			angle,
			position,
			velocity
		}
	})
}

export function puckMessageToState (pucks, device, devices) {
	const boardWidth = getBoardWidth(devices)
	const boardLength = getBoardLength(devices)

	if (!Array.isArray(pucks)) {
		pucks = Object.values(pucks)
	}
	return pucks.map(puck => {
		let angle = puck.angle
		let position = {...puck.position}
		let velocity = {...puck.velocity}

		if (!device.directionY) {
			angle += Math.PI / 2

			//swap x and y
			const tempPX = position.x
			const tempVX = velocity.x
			//WHy doesnt this work
			position.x = position.y
			position.y = boardWidth - tempPX

			velocity.x = velocity.y
			velocity.y = -tempVX
		}

		if (device.inverted) {
			angle += Math.PI
			velocity.x = -velocity.x
			velocity.y = -velocity.y

			if (device.directionY) {
				//NOT sure if this should be flipped by boardWidth or device.width - should boe boardWidth, b/c svg is transformed to center boardWidth
				position.x = boardWidth - position.x
				position.y = boardLength - position.y
			} else {
				position.x = boardLength - position.x
				position.y = boardWidth - position.y
			}
		}

		return {
			label: puck.label,
			angle,
			position,
			velocity
		}
	})
}

export function getScoreFromPucks(pucks=[], devices={}, socketId) {
	const device = devices[socketId]
	const stdPucks = puckStateToMessage(pucks, device, devices)
	const boardLength = getBoardLength(devices)
	const boardWidth = getBoardWidth(devices)
	let redScore = 0
	let blueScore = 0


	//NOTE: these are puckElements
	stdPucks.forEach(puck => {
		const {x: puckX, y: puckY} = puck.position

		// console.log("getScoreFromPucks puckX: ", puckX, ", puckY: ", puckY, ", boardLength: ", boardLength)
		if (puckX > wallHeight && puckX < (boardWidth - wallHeight)) {
			// console.log("puckX inbounds")
			if (puckY > boardLength) {
				//dont count
				// console.log("puckY greater than boardLength")
			} else if (puckY > (boardLength - scoreBoxHeight)) {
				if (puck.label === TEAM_TYPES.RED) {
					redScore += 3
				} else if (puck.label === TEAM_TYPES.BLUE) {
					blueScore += 3
				}
			} else if (puckY > (boardLength - 2 * scoreBoxHeight)) {
				if (puck.label === TEAM_TYPES.RED) {
					redScore += 2
				} else if (puck.label === TEAM_TYPES.BLUE) {
					blueScore += 2
				}
			} else if (puckY > (boardLength - 3 * scoreBoxHeight)) {
				if (puck.label === TEAM_TYPES.RED) {
					redScore += 1
				} else if (puck.label === TEAM_TYPES.BLUE) {
					blueScore += 1
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

export function showOrientationModal() {
	return {
		type: SHOW_ORIENTATION_MODAL
	}
}

export function acceptModal() {
	broadcastAcceptModal()

	if (!hasInitializedAudio && mouseDownSound && throwSound && gutterSound) {
		mouseDownSound.play().then(() => {
			mouseDownSound.stop()
		})
		throwSound.play().then(() => {
			throwSound.stop()
		})
		gutterSound.play().then(() => {
			gutterSound.stop()
		})

		hasInitializedAudio = true
	}

	return {
		type: ACCEPT_MODAL
	}
}

//Sound Effects
export function Sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
      return this.sound.play();
    }
    this.stop = function(){
      return this.sound.pause();
    }
    this.volume = function(vol) {
    	this.sound.volume = vol;
    }
}
