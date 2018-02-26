import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link, withRouter } from 'react-router';
import IconButton from 'material-ui/IconButton'
import FullScrIcon from 'material-ui/svg-icons/image/crop-free'

import './shuffleboard.scss';
import moment from 'moment'
import _ from 'underscore'
import * as d3 from 'd3'
import {
	// setBoardDimensions,
	// updatePucks,
	startTurn,
	getBoardLength,
	getBoardWidth,
	getLengthOffset,
	TEAM_TYPES
} from 'app/actions/shuffleboard-actions'
import {
	broadcastPucks
} from 'app/actions/socket-actions'
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
require('images/wood_grain3.jpg')
require('images/wood_grain3_side.jpg')


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

function generatePuckMessage(pucks = [], device) {
	//NOTE: will need to transform everything depending on device.directionY
	// console.log("generatePuckMessage pucks: ", pucks)
	return pucks.map(puck => ({
		angle: puck.angle,
		position: puck.position,
		velocity: puck.velocity
	}))
}

function isBoardActive (pucks = []) {
	//TODO: should also consider if a puck has left the board area
	return pucks.reduce((isActive, puck) => {
		if (isActive) {
			return isActive
		}

		return (Math.abs(puck.velocity.x) + Math.abs(puck.velocity.y)) > 0.01
	}, false)
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


const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {
	startTurn,
	// broadcastPucks
})
@withRouter
export default class Shuffleboard extends Component {
	constructor() {
		super()

	}
	componentDidMount() {
		const {
			boardConfig: {
				devices,
				socketId
			},
			router,
			startTurn,
			// broadcastPucks
		} = this.props
		const boardLength = getBoardLength(devices)
		const boardWidth = getBoardWidth(devices)
		const lengthOffset = getLengthOffset(socketId, devices)
		const device = devices[socketId]
		const shuffleboardCanvas = document.getElementById('shuffleboard-canvas')

		if (_.isEmpty(devices)) {
			return router.push('/orientation')
		}

		this.engine = Engine.create()
		this.world = this.engine.world
		this.renderMatter = Render.create({
			element: shuffleboardCanvas,
			engine: this.engine,
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

		this.world.gravity.y = 0

		Render.run(this.renderMatter)

		this.runner = Runner.create()
		Runner.run(this.runner, this.engine)

		const scoreBoxes = createScoreBoxes({
			device,
			boardWidth,
			boardLength
		})

	//   //Score boxes
	//   const scoreBoxProps = {
	//   	isStatic: true,
		// 	collisionFilter: {
	//       mask: 'none'
	//    	},
	//    	render: {
	//    		strokeStyle: 'rgba(0,0,0,0.2)',
	//    		fillStyle: 'rgba(0,0,0,0)',
	//    		lineWidth: 5
	//    	}
	//   }

	//   const oppScoreBoxProps = {
	//   	isStatic: true,
		// 	collisionFilter: {
	//       mask: 'none'
	//    	},
	//    	render: {
	//    		strokeStyle: 'rgba(0,0,200,0.2)',
	//    		fillStyle: 'rgba(0,0,0,0)',
	//    		lineWidth: 5
	//    	}
	//   }

	//   // Score box dimmensions
	//   const scoreBoxHeight = 100
	//   const scoreLabels = [null, null, null]
	//   	.map((scoreBox, index) => {
	//   		return Bodies.rectangle(
	//   			...getScoreDimmensions({
	//   				device,
	//   				index,
	//   				scoreBoxHeight,
	//   				scoreBox,
	//   				boardWidth,
	//   				boardLength
	//   			}),
	//   			{
		// 				...scoreBoxProps,
		// 				render: {
		// 					...scoreBoxProps.render,
		// 					sprite: {
		// 						texture: require(`images/number_${3 - index}.png`)
		// 					}
		// 				}
		// 			}
	//   		)
		// 	})
		// 	.map(body => {
		// 		Body.rotate(body, device.directionY ? Math.PI : Math.PI / 2)
		// 		return body
		// 	})
		
		// const scoreBoxes = scoreLabels.map((scoreBox, index) => {
		// 	return Bodies.rectangle(
	// 			...getScoreDimmensions({
	// 				device,
	// 				index,
	// 				scoreBoxHeight,
	// 				scoreBox,
	// 				boardWidth,
	// 				boardLength
	// 			}),
	// 			{
		// 			...scoreBoxProps
		// 		}
	// 		)
		// })

		// const oppScoreLabels = [null, null, null]
	//   	.map((scoreBox, index) => {
	//   		return Bodies.rectangle(
	 //  			...getOppScoreDimmensions({
	 //  				device,
	 //  				index,
	 //  				scoreBoxHeight,
	 //  				scoreBox,
	 //  				boardWidth,
	 //  				boardLength
	 //  			}),
	 //  			{
		// 				...scoreBoxProps,
		// 				render: {
		// 					...scoreBoxProps.render,
		// 					sprite: {
		// 						texture: require(`images/number_${3 - index}.png`)
		// 					}
		// 				}
		// 			}
	 //  		)
		// 	})
		// 	.map(body => {
		// 		Body.rotate(body, device.directionY ? 0 : -Math.PI / 2)
		// 		return body
		// 	})
		// const oppScoreBoxes = oppScoreLabels.map((scoreBox, index) => {
		// 	return Bodies.rectangle(
	 //  			...getOppScoreDimmensions({
	 //  				device,
	 //  				index,
	 //  				scoreBoxHeight,
	 //  				scoreBox,
	 //  				boardWidth,
	 //  				boardLength
	 //  			}),
	 //  			{
		// 				// ...scoreBoxProps
		// 				...oppScoreBoxProps
		// 			}
	 //  		)
		// })

		// World.add(this.world, [
		// 	...scoreLabels,
		// 	...scoreBoxes,
		// 	...oppScoreLabels,
		// 	...oppScoreBoxes
		// ])

		World.add(this.world, scoreBoxes)


		const walls = createWalls({
			directionY: device.directionY,
			boardWidth,
			boardLength
		})

		World.add(this.world, walls)


		//Pucks
		const puckRad = 35
		const wallHeight = 40
		const scoreBoxHeight = 100

		const redPucks = [null, null, null, null]
			.map((puck, index) => {
				let x = 0
				let y = 0

				if (device.directionY && !device.inverted) {
					x = wallHeight - puckRad
					y = (index + 0.5) * scoreBoxHeight
				} else if (device.directionY && device.inverted) {
					x = boardWidth - wallHeight + puckRad
					y = boardLength - (index + 0.5) * scoreBoxHeight
				} else if (!device.directionY && !device.inverted) {
					x = (index + 0.5) * scoreBoxHeight
					y = device.height - wallHeight + puckRad
				} else if (!device.directionY && device.inverted) {
					x = boardLength - (index + 0.5) * scoreBoxHeight
					y = wallHeight - puckRad
				}

				return Bodies.circle(x, y, puckRad, {
					frictionAir: 0.03,
					restitution: 0.9,
					render: {
		        sprite: {
		          // texture: puck.team === 'RED'
		          // 	? require('images/red_puck.png')
		          // 	: require('images/black_puck.png')
		          texture: require('images/red_puck.png')
		        }
		      }
				})
			})
		const bluePucks = [null, null, null, null]
			.map((puck, index) => {
				let x = 0
				let y = 0

				if (device.directionY && !device.inverted) {
					x = boardWidth - wallHeight + puckRad
					y = boardLength - (index + 0.5) * scoreBoxHeight
				} else if (device.directionY && device.inverted) {
					x = wallHeight - puckRad
					y = (index + 0.5) * scoreBoxHeight
				} else if (!device.directionY && !device.inverted) {
					x = boardLength - (index + 0.5) * scoreBoxHeight
					y = wallHeight - puckRad
				} else if (!device.directionY && device.inverted) {
					x = (index + 0.5) * scoreBoxHeight
					y = device.height - wallHeight + puckRad
				}

				// console.log("x: ", x, ", y: ", y)
				return Bodies.circle(x, y, puckRad, {
					frictionAir: 0.01,
					restitution: 0.9,
					render: {
		        sprite: {
		          texture: require('images/black_puck.png')
		        }
		      }
				})
			})

		this.puckElements = [...redPucks, ...bluePucks]

		console.log("this.puckElements: ", this.puckElements)

		World.add(this.world, this.puckElements);

		// add mouse control
		this.mouse = Mouse.create(this.renderMatter.canvas)
		this.mouseConstraint = MouseConstraint.create(this.engine, {
				mouse: this.mouse,
				constraint: {
						stiffness: 0.2,
						render: {
								visible: false
						}
				}
		});

		World.add(this.world, this.mouseConstraint);

		// keep the mouse in sync with rendering
		this.renderMatter.mouse = this.mouse;

		//Add Mouse move event listener
		let isListening = false
		const pollInterval = 500
		Events.on(this.mouseConstraint, "mousedown", (e) => {
			isListening = true
			
			//TODO: need to clean this up on component received props - look for updates to pucks to 
			if (this.broadcastPoll) {
				clearInterval(this.broadcastPoll)
			}
			this.broadcastPoll = setInterval(() => {
				// console.log("broadcastPoll called")

				//TODO: check if balls are moving, if not, clear interval
				const boardIsActive = isBoardActive(this.puckElements)

				// console.log("boardIsActive: ", boardIsActive, ", this.puckElements: ", this.puckElements)

				if (!boardIsActive) {
					console.log("board is no longer active, clearing Interval")
					clearInterval(this.broadcastPoll)
					return
				}
				if (this.puckElements) {
					const nextPucks = generatePuckMessage(this.puckElements, device)

					broadcastPucks(nextPucks)
				}
			}, pollInterval)
			console.log("mousedown, should fire action ")

		})
		Events.on(this.mouseConstraint, "mousemove", (e) => {
			// console.log("mousemove e: ", e.source.mouse)
			//TODO: here broadcase all puck positions and velocities

			if (this.puckElements && isListening) {
				const nextPucks = generatePuckMessage(this.puckElements, device)

				broadcastPucks(nextPucks)
			}

		})
		Events.on(this.mouseConstraint, "mouseup", (e) => {
			isListening = false
		})

		// fit the render viewport to the scene
		Render.lookAt(this.renderMatter, {
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
			lengthOffset
		})

		console.log("shuffleboardCanvas.style: ", createCanvasStyle({
			device,
			boardWidth,
			boardLength,
			lengthOffset
		}))
		// shuffleboardCanvas.style = `\
		// transform: translate(\
		// 	${device.directionY ? (device.width - boardWidth) / 2 : -lengthOffset}px,\
		// 	${device.directionY ? -lengthOffset : (device.height - boardWidth) / 2}px\
		// );\
		// width: ${device.directionY ? (boardWidth + 'px') : (boardLength + 'px')};\
		// height: ${device.directionY ? (boardLength + 'px') : (boardWidth + 'px')};`




		// width: ${device.directionY ? (boardWidth + 'px') : 'auto'};\
		// height: ${device.directionY ? 'auto' : (boardWidth + 'px')};`

		// request fullscreen mode
		// console.log("requesting fullscreen: ",shuffleboardCanvas.requestFullScreen)
		// if (shuffleboardCanvas.requestFullScreen) {
		// 	shuffleboardCanvas.requestFullScreen()
		// } else if (shuffleboardCanvas.webkitRequestFullscreen) {
		// 	shuffleboardCanvas.webkitRequestFullscreen()
		// }
	}

	componentDidUpdate({boardConfig: {pucks: oldPucks}}) {
		// this.drawBoard()

		const {boardConfig: {pucks}} = this.props

		if (pucks !== oldPucks){
			this.puckElements.forEach((puck, index) => {
				// console.log("updating Body to puck: ", puck, ", pucks[index]: ", pucks[index])
				Body.setAngle(puck, pucks[index].angle)
				Body.setPosition(puck, pucks[index].position)
				Body.setVelocity(puck, pucks[index].velocity)
			})

			//stop broadcasting

			// console.log("clearing Interval this.broadcastPoll: ", this.broadcastPoll)
			clearInterval(this.broadcastPoll)
		}
	}

	drawBoard() {
	}

	render() {
		const {
			boardConfig: {
				devices = {},
				socketId
			},
			router
		} = this.props
		const device = devices[socketId] || {}

		//Print the board orders and in what order you are in
		const sortedDevices = Object.values(devices).sort((devA, devB) => {
			return devA.timestamp > devB.timestamp
		})

		console.log("sortedDevices: ", sortedDevices)
		console.log("I am: ", sortedDevices.map(dev => dev.id).indexOf(socketId))

		return (
			<div className={`shuffleboard-container ${device.directionY ? '' : ' sideways'}`} id="shuffleboard-container">
				<div id="shuffleboard-canvas">
				</div>

				{/*<div className="menu">
					<IconButton
						onTouchTap={e => {
							console.log("onClick called! e: ", e)
							toggleFullScreen()
						}}
						style={{cursor:'pointer'}}
					>
						<FullScrIcon color="#FFF"/>
					</IconButton>
				</div>*/}
			</div>
		);
	}
}

function toggleFullScreen() {
	var doc = window.document;
	// var docEl = doc.documentElement;
	const docEl = document.getElementById('shuffleboard-canvas')

	var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
	var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

	if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
		requestFullScreen.call(docEl);
	}
	else {
		cancelFullScreen.call(doc);
	}
}
