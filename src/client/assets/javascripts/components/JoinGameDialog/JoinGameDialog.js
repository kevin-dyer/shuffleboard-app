import React, { Component } from 'react';
import {connect} from 'react-redux';
import { push } from 'react-router-redux'
// import IconButton from 'material-ui/IconButton'
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog'
import TextField from 'material-ui/TextField';
import PhoneIcon from 'material-ui/svg-icons/hardware/phone-android'
import TouchIcon from 'material-ui/svg-icons/action/touch-app'
import ArrowIcon from 'material-ui/svg-icons/action/trending-flat'
import {blueGrey800, blueGrey600, blueGrey300} from 'material-ui/styles/colors'
import {startGame, joinGame, broadcastDoneWaiting} from 'app/actions/socket-actions'
import './JoinGameDialog.scss'

const iconColor = blueGrey600
const iconColor2 = blueGrey300
const iconStyle = {
	height: 40,
	width: 40,
	margin: '0'
}

const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {
	push
})
export default class JoinGameDialog extends Component {
	componentWillMount() {
		console.log("JoinGameDialog componentWillMount ")
		const {
			boardConfig: {
				clients=[],
				roomPin=''
			}={},
			push
		} = this.props

		if (!clients || !roomPin) {
			push('/start')
		}
	}
	handleStartGame(e) {
		//TODO: redirect to /orientation
		const {push} = this.props

		broadcastDoneWaiting()
		push('/orientation')
	}

	render() {
		const {
			boardConfig: {
				clients=[],
				roomPin=''
			}={}
		} = this.props


		return (
			<Dialog
				title='Wait for everyone to Join'
				open={true}
				onRequestClose={()=>{}}
				actions={[
					<RaisedButton
						label="Continue"
						onTouchTap={::this.handleStartGame}
						primary={true}
					/>
				]}
				titleStyle={{textAlign: 'center'}}
				actionsContainerStyle={{
					display: "flex",
					alignItems: 'center',
					justifyContent: 'center'
				}}
			>
				<div>
					<div className="game-pin">
						PIN: {roomPin}
					</div>

					<div className="clients">
						<div className="clients-container">
							{clients.map(client =>
								<PhoneIcon key={client} color={iconColor} style={iconStyle}/>
							)}
						</div>
					</div>
				</div>
			</Dialog>
		);
	}
}