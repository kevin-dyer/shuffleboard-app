import React, { Component } from 'react';
import {connect} from 'react-redux';
import { push } from 'react-router-redux'
import IconButton from 'material-ui/IconButton'
import FullScrIcon from 'material-ui/svg-icons/image/crop-free'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';

import {
	startTurn,
	getBoardLength,
	getBoardWidth,
	getLengthOffset,
	generatePuckMessage,
	isBoardActive,
	TEAM_TYPES,
	acceptModal,
	getGameState,
	playAgain,
	exitGame
} from 'app/actions/shuffleboard-actions'
import {
	broadcastPucks,
	broadcastExitGame,
	broadcastPlayAgain
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

import './GameDialog.scss';


const stateToProps = ({boardConfig}) => ({
	boardConfig
})

@connect(stateToProps, {
	// cancelModal,
	acceptModal,
	getGameState,
	startTurn,
	playAgain,
	exitGame,
	push
})
// @withRouter
export default class GameDialog extends Component {
	constructor() {
		super()

	}

	componentDidUpdate({boardConfig: {dialog: {accepted: prevAccepted}}}) {
		const {boardConfig: {dialog: {accepted}}} = this.props
		if (!prevAccepted && accepted) {
			this.handleAccept()
		}
	} 

	handleAccept() {
		const {
			boardConfig: {pucks=[], devices},
			getGameState,
			startTurn
		} = this.props //May not need devices and pucks
		const gameState = getGameState()
		// this.props.acceptModal()

		//use current game state to determing which action to fire
		//if no pucks exist, show st
		if (gameState.isGameOver) {
			// End Game
			console.log("game has ended. TODO: reset board")

		} else if (devices && Object.keys(devices).length > 0) {
			console.log("calling startTurn from GameDialog handleAccept")
			startTurn()
		}
	}

	handlePlayAgain() {
		const {
			playAgain
		} = this.props

		broadcastPlayAgain()
		playAgain()
	}

	handleExitGame() {
		const {push, exitGame} = this.props

		broadcastExitGame()
		exitGame()
	}

	renderActionBtns(gameState={}) {
		const {
			// boardConfig: {
			// 	devices = {},
			// 	socketId,
			// 	dialog: {
			// 		title,
			// 		body,
			// 		accepted
			// 	}
			// },
			acceptModal,
			getGameState
		} = this.props

		return gameState.isGameOver
			? [
					<FlatButton
						label="Play Again"
						primary={true}
						keyboardFocused={true}
						onTouchTap={::this.handlePlayAgain}
					/>,
					<FlatButton
						label="Exit"
						primary={true}
						keyboardFocused={false}
						onTouchTap={::this.handleExitGame}
					/>
				]
			: [
					<FlatButton
						label="Ok"
						primary={true}
						keyboardFocused={true}
						onTouchTap={acceptModal}
					/>
				]
	}

	renderScore(gameState={}) {
		const {
			boardConfig: {
				devices = {},
				socketId,
				dialog: {
					title,
					body,
					accepted
				}
			},
			acceptModal
		} = this.props
		const {
			score={},
			isRedsTurn=true,
			isGameOver=false
		} = gameState

		return (
			<div className="score-container">
				{/*<div className="score-title">
					Score
				</div>*/}
				<div className="score-content">
					<div className="score-box red-score">
						<div className="score-number red-score-number">
							{score.red || 0}
						</div>
						<div className="score-label red-score-label">
							Red
						</div>
					</div>
					<div className="score-box blue-score">
						<div className="score-number blue-score-number">
							{score.blue || 0}
						</div>
						<div className="score-label blue-score-label">
							Blue
						</div>
					</div>
				</div>
			</div>
		)
	}

	render() {
		const {
			boardConfig: {
				devices = {},
				socketId,
				dialog: {
					title,
					body,
					accepted
				},
				pucks
			},
			acceptModal,
			getGameState
		} = this.props
		const device = devices[socketId] || {directionY: true, inverted: true}
		const gameState = getGameState()
		const actionBtns = ::this.renderActionBtns(gameState)
		const scoreContent = ::this.renderScore(gameState)

		//TODO: need to decide when to show/hide this modal based on state
			// can fire generic action for each button
			// also need to decide when to show cancle button - this should be held in state
		//How to decide which actions to bind to the action buttons
		return (
			<Dialog
				title={title}
				actions={actionBtns}
				open={!accepted}
				onRequestClose={()=>{}}
				autoScrollBodyContent={true}
				contentStyle={{
					transform: `rotate(${!device.directionY
						? device.inverted
							? 270
							: 90
						: device.inverted
							? 0
							: 180
					}deg)`,
					maxWidth: 350,
					maxHeight: 400
				}}
				titleStyle={{
					textAlign: 'center',
					textTransform: 'capitalize'
				}}
				actionsContainerStyle={{
					display: "flex",
					alignItems: 'center',
					justifyContent: 'center'
				}}
			>
				{gameState.isGameOver &&
					<div className="winning-team">
						{gameState.score.red > gameState.score.blue ? 'Red' : 'Blue'} team Won!
					</div>
				}
				{pucks && pucks.length
					? scoreContent
					: (
							<div className="red-starts">
								Red team will start
							</div>
						)
				}
			</Dialog>
		);
	}
}
