import React, { Component } from 'react';
import {connect} from 'react-redux';
import { push } from 'react-router-redux'
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
	initBoard,
	push
})
export default class Shuffleboard extends Component {
	componentDidMount() {
		const {
			boardConfig: {
				devices,
				socketId,
				roomId
			},
			startTurn,
			showStartGameModal,
			initBoard,
			push
		} = this.props
		const boardLength = getBoardLength(devices)
		const boardWidth = getBoardWidth(devices)
		const lengthOffset = getLengthOffset(socketId, devices)
		const device = devices[socketId]
		const shuffleboardCanvas = document.getElementById('shuffleboard-canvas')

		//move into component will receive props
		console.log("Shuffleboard roomId: ", roomId)
		if (!roomId) {
			console.log("Shufflebloard redirecting to /start bc no roomId")
			return push('/start')
		}

		initBoard(shuffleboardCanvas)
		showStartGameModal()
	}

	//QUESTION: is this still useful?
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

	render() {
		const {
			boardConfig: {
				devices = {},
				socketId,
				broadcastLatency,
				broadcastDevice
			},
			router
		} = this.props
		const device = devices[socketId] || {}
		//steps of 10
		const formattedLatency = Math.floor(broadcastLatency / 10) * 10

		return (
			<div
				className={`shuffleboard-container ${device.directionY ? '' : ' sideways'}`}
				id="shuffleboard-container"
			>
				<div id="shuffleboard-canvas">
				</div>
				{broadcastDevice === device &&
					<div className="board-stats">
						<div>Latency: {formattedLatency}ms</div>
					</div>
				}

				<GameDialog/>
			</div>
		);
	}
}