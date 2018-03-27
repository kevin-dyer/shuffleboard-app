import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link, withRouter } from 'react-router';
import IconButton from 'material-ui/IconButton'
import FullScrIcon from 'material-ui/svg-icons/image/crop-free'
import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';

// import './GameDialog.scss';
import {
	// setBoardDimensions,
	// updatePucks,
	startTurn,
	getBoardLength,
	getBoardWidth,
	getLengthOffset,
	generatePuckMessage,
	isBoardActive,
	TEAM_TYPES,
	// cancelModal,
	acceptModal,
	getGameState,
	showStartGameModal,
	showGameOverModal
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


const stateToProps = ({boardConfig}) => ({
	boardConfig
})

@connect(stateToProps, {
	// cancelModal,
	acceptModal,
	getGameState,
	//TODO: fire these on component did update
	showStartGameModal,
	showGameOverModal,

	startTurn
})
@withRouter
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
			boardConfig: {pucks=[]},
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
		} else {
			startTurn()
		}

		// const {acceptModal} = this.props

		// acceptModal()
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
				}
			},
			acceptModal
		} = this.props
		const device = devices[socketId] || {}

		//TODO: need to decide when to show/hide this modal based on state
			// can fire generic action for each button
			// also need to decide when to show cancle button - this should be held in state
		//How to decide which actions to bind to the action buttons
		return (
			<Dialog
        title={title}
        actions={[
		      <FlatButton
		        label="Ok"
		        primary={true}
		        keyboardFocused={true}
		        onClick={acceptModal}
		      />,
		    ]}
        modal={false}
        open={!accepted}
        onRequestClose={()=>{}}
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
      >
        {body}
      </Dialog>
		);
	}
}
