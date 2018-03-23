import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link, withRouter } from 'react-router';
import IconButton from 'material-ui/IconButton'
import FullScrIcon from 'material-ui/svg-icons/image/crop-free'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import GameDialog from '../GameDialog'

import './shuffleboard.scss';
import moment from 'moment'
import _ from 'underscore'
// import * as d3 from 'd3'
import {
	startTurn,
	showStartGameModal,
	getBoardLength,
	getBoardWidth,
	getLengthOffset,
	generatePuckMessage,
	isBoardActive,
	TEAM_TYPES,
	initBoard
} from 'app/actions/shuffleboard-actions'


const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {
	startTurn,
	showStartGameModal,
	// broadcastPucks,
	initBoard
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
			showStartGameModal,
			// broadcastPucks,
			initBoard
		} = this.props

		console.log("Shuffleboard componentDidMount")
		const boardLength = getBoardLength(devices)
		const boardWidth = getBoardWidth(devices)
		const lengthOffset = getLengthOffset(socketId, devices)
		const device = devices[socketId]
		const shuffleboardCanvas = document.getElementById('shuffleboard-canvas')

		console.log("componentDidMount in Shuffleboard")
		//move into component will receive props
		if (_.isEmpty(devices)) {
			return router.push('/orientation')
		}

		initBoard(shuffleboardCanvas)


		// //TODO: replace
		// // display modal that kicks off first turn
		// // call action
		// showStartGameModal({world: this.world})
		// //Pucks
		// const puckRad = 35
		// const wallHeight = 40
		// const scoreBoxHeight = 100

		// // const redPucks = [null, null, null, null]
		// // 	.map((puck, index) => {
		// // 		let x = 0
		// // 		let y = 0

		// // 		if (device.directionY && !device.inverted) {
		// // 			x = wallHeight - puckRad
		// // 			y = (index + 0.5) * scoreBoxHeight
		// // 		} else if (device.directionY && device.inverted) {
		// // 			x = boardWidth - wallHeight + puckRad
		// // 			y = boardLength - (index + 0.5) * scoreBoxHeight
		// // 		} else if (!device.directionY && !device.inverted) {
		// // 			x = (index + 0.5) * scoreBoxHeight
		// // 			y = device.height - wallHeight + puckRad
		// // 		} else if (!device.directionY && device.inverted) {
		// // 			x = boardLength - (index + 0.5) * scoreBoxHeight
		// // 			y = wallHeight - puckRad
		// // 		}

		// // 		return Bodies.circle(x, y, puckRad, {
		// // 			frictionAir: 0.03,
		// // 			restitution: 0.9,
		// // 			render: {
		// //         sprite: {
		// //           texture: require('images/red_puck.png')
		// //         }
		// //       }
		// // 		})
		// // 	})
		// // const bluePucks = [null, null, null, null]
		// // 	.map((puck, index) => {
		// // 		let x = 0
		// // 		let y = 0

		// // 		if (device.directionY && !device.inverted) {
		// // 			x = boardWidth - wallHeight + puckRad
		// // 			y = boardLength - (index + 0.5) * scoreBoxHeight
		// // 		} else if (device.directionY && device.inverted) {
		// // 			x = wallHeight - puckRad
		// // 			y = (index + 0.5) * scoreBoxHeight
		// // 		} else if (!device.directionY && !device.inverted) {
		// // 			x = boardLength - (index + 0.5) * scoreBoxHeight
		// // 			y = wallHeight - puckRad
		// // 		} else if (!device.directionY && device.inverted) {
		// // 			x = (index + 0.5) * scoreBoxHeight
		// // 			y = device.height - wallHeight + puckRad
		// // 		}

		// // 		// console.log("x: ", x, ", y: ", y)
		// // 		return Bodies.circle(x, y, puckRad, {
		// // 			frictionAir: 0.01,
		// // 			restitution: 0.9,
		// // 			render: {
		// //         sprite: {
		// //           texture: require('images/black_puck.png')
		// //         }
		// //       }
		// // 		})
		// // 	})

		// // this.puckElements = [...redPucks, ...bluePucks]

		// // console.log("this.puckElements: ", this.puckElements)

		// // World.add(this.world, this.puckElements);
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

	accpetModalHandler() {
		// const {} = this.props
		//TODO: call acceptModal action
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

		// //Print the board orders and in what order you are in
		// const sortedDevices = Object.values(devices).sort((devA, devB) => {
		// 	return devA.timestamp > devB.timestamp
		// })

		console.log("rendering shuffleboard")
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

				<GameDialog/>
			</div>
		);
	}
}

// function toggleFullScreen() {
// 	var doc = window.document;
// 	// var docEl = doc.documentElement;
// 	const docEl = document.getElementById('shuffleboard-canvas')

// 	var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
// 	var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

// 	if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
// 		requestFullScreen.call(docEl);
// 	}
// 	else {
// 		cancelFullScreen.call(doc);
// 	}
// }
