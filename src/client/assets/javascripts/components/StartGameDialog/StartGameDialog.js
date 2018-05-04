import React, { Component } from 'react';
import {connect} from 'react-redux';
import { push } from 'react-router-redux'

// import IconButton from 'material-ui/IconButton'
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog'
import Paper from 'material-ui/Paper'
import TextField from 'material-ui/TextField';
// import {showAllowJoinModal} from 'app/actions/shuffleboard-actions'

import _ from 'underscore'
import {
} from 'app/actions/shuffleboard-actions'
import {startGame, joinGame} from 'app/actions/socket-actions'
import './StartGameDialog.scss'


const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {
	push
})
export default class StartGameDialog extends Component {
	constructor() {
		super()

		this.state= {
			pin: ''
		}
	}

	// componentDidMount() {
	// 	//TODO: set body to fixed
	// 	document.body.position = 'fixed'
	// }

	// componentWillUnmount() {
	// 	document.body.position = 'relative'
	// }
	handleStartGame(e) {
		const {push} = this.props
		startGame()

		//show Wait for people to join 
		console.log("redirecting to /join")
		push('/join')
	}
	handleInputChange(e, pin) {
		this.setState({pin})
	}

	isPinValid(pin) {
		// console.log("pin: ",pin, ", isValid ", !isNaN(pin) && pin.length === 4)
		return !isNaN(pin) && pin.length === 4
	}

	render() {
		const {pin} = this.state

		// console.log("StartGameDialog pin state: ", pin)
		// return (
		// 	<Dialog
		// 		title='Play Shuffleboard!'
		// 		open={true}
		// 		onRequestClose={()=>{}}
		// 		autoScrollBodyContent={true}
		// 		titleStyle={{textAlign: 'center'}}
		// 	>
		// 		<div style={{
		// 			display: "flex",
		// 			flexDirection: 'column',
		// 			alignItems: 'center',
		// 			justifyContent: 'center'
		// 		}}>
		// 			<RaisedButton
		// 				label="Start a New Game"
		// 				onTouchTap={startGame}
		// 				primary={!pin}
		// 				style={{
		// 					marginTop: 10
		// 				}}
		// 			/>

		// 			<form onSubmit={e => {
		// 				joinGame(pin);
		// 				e.preventDefault();
		// 				e.stopPropagation();
		// 			}} className="join-game-container">
		// 				<TextField
		// 					className='join-input'
		// 					floatingLabelText="Join w/ PIN"
		// 					hintText="Enter PIN"
		// 					onChange={::this.handleInputChange}
		// 					inputStyle={{
		// 						fontSize: 20
		// 					}}
		// 				/>
		// 				<FlatButton
		// 					label="Join"
		// 					disabled={!this.isPinValid(pin)}
		// 					type="submit"
		// 					primary={!!pin}
		// 				/>
		// 			</form>
		// 		</div>
		// 	</Dialog>
		// );

		return (
			<div className="start-wrapper">
			<Paper style={{
				width: '100%',
				maxWidth: '400px',
				height: '100%',
				padding: '20px 10px',
				display: "flex",
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'space-around',
				overflowY: 'auto',
				backgroundColor: 'rgba(255,255,255,0.85)'
			}}>
				<h3 className="start-title">Shuffle with Friends</h3>
				<RaisedButton
					label="Start a New Game"
					onTouchTap={startGame}
					primary={!pin}
				/>

				<div className="or">-- or --</div>

				<form onSubmit={e => {
					joinGame(pin);
					e.preventDefault();
					e.stopPropagation();
				}} className="join-game-container">
					<TextField
						className='join-input'
						floatingLabelText="Join with PIN"
						hintText="Enter PIN"
						onChange={::this.handleInputChange}
						inputStyle={{
							fontSize: 20
						}}
					/>
					<FlatButton
						label="Join"
						disabled={!this.isPinValid(pin)}
						type="submit"
						primary={!!pin}
					/>
				</form>
			</Paper>
			</div>
		);
	}
}