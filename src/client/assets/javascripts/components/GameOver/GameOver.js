import React, { Component } from 'react';
import {connect} from 'react-redux';
// import { Link, withRouter } from 'react-router';
import { push } from 'react-router-redux'
// import IconButton from 'material-ui/IconButton'
// import FullScrIcon from 'material-ui/svg-icons/image/crop-free'
// import Dialog from 'material-ui/Dialog'
// import FlatButton from 'material-ui/FlatButton';
// import RaisedButton from 'material-ui/RaisedButton';
import GameDialog from '../GameDialog'

// import './shuffleboard.scss';
// import moment from 'moment'
// import _ from 'underscore'
// import {
// 	startTurn,
// 	showStartGameModal,
// 	getBoardLength,
// 	getBoardWidth,
// 	getLengthOffset,
// 	generatePuckMessage,
// 	isBoardActive,
// 	TEAM_TYPES,
// 	initBoard
// } from 'app/actions/shuffleboard-actions'


const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {
	push
})
export default class GameOver extends Component {
	componentWillMount() {
		const {
			boardConfig: {
				roomId
			},
			push
		} = this.props

		//TODO: redirect if no roomId
		if (!roomId) {
			push('/start')
		}
	}
	render() {
		// const {
		// 	boardConfig: {
		// 		devices = {},
		// 		socketId
		// 	},
		// 	router
		// } = this.props
		// const device = devices[socketId] || {}

		// //Print the board orders and in what order you are in
		// const sortedDevices = Object.values(devices).sort((devA, devB) => {
		// 	return devA.timestamp > devB.timestamp
		// })

		return (
			<GameDialog/>
		);
	}
}
