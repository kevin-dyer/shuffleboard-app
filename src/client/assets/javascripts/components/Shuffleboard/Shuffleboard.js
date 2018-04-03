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
				socketId,
				roomId
			},
			router,
			startTurn,
			showStartGameModal,
			initBoard
		} = this.props
		const boardLength = getBoardLength(devices)
		const boardWidth = getBoardWidth(devices)
		const lengthOffset = getLengthOffset(socketId, devices)
		const device = devices[socketId]
		const shuffleboardCanvas = document.getElementById('shuffleboard-canvas')


		// console.log("boardWidth: ", boardWidth)
		//move into component will receive props
		console.log("Shuffleboard roomId: ", roomId)
		if (!roomId) {
			console.log("Shufflebloard redirecting to /start bc no roomId")
			return router.push('/start')
		}

		initBoard(shuffleboardCanvas)
		showStartGameModal()
	}

	componentDidUpdate({boardConfig: {clients: prevClients=[]}}) {
		const {
			boardConfig: {
				clients=[]
			}
		} = this.props

		if (prevClients.length !== clients.length && clients.length <= 1) {
			console.log("There are not enough clients in the room, redirecting you back to Start Game Modal")
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
