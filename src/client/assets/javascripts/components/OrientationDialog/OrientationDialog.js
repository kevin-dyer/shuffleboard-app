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
// import {startGame, joinGame, broadcastDoneWaiting} from 'app/actions/socket-actions'
import {acceptModal} from 'app/actions/shuffleboard-actions'
import './OrientationDialog.scss'

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
	acceptModal
})
export default class OrientationDialog extends Component {

	render() {
		const {
			boardConfig: {
				clients=[],
				roomPin='',
				dialog: {accepted}
			}={},
			acceptModal
		} = this.props


		return (
			<Dialog
        title='Orient the Board'
        open={!accepted}
        onRequestClose={()=>{}}
      >
        <div>
        	<div className="instructions">
        		<p>
        			Place devices flat on a table in a straight line to create your shuffleboard.
        		</p>
        		<p>
        			Then drag a finger from the start of the board to the end to configure it.
        		</p>
        	</div>

        	<div className="orientation-container">
        		<div className="inner-container">
	        		<div className="clients-container">
	        			{clients.map(client =>
	        				<PhoneIcon key={client} color={iconColor2} style={{
	        					...iconStyle,
	        					transform: 'rotate(90deg)'
	        				}}/>
	        			)}
	        		</div>

	        		<div className="touch-animation">
		        		<TouchIcon
		        			className="touch-icon"
		        			color={iconColor}
		        			style={iconStyle}
		        		/>
		        	</div>
		        	<div className="arrow-animation"/>
		        </div>
        	</div>
        	<RaisedButton
        		label="Configure Board"
        		onTouchTap={acceptModal}
        		primary={true}
        	/>
        </div>
      </Dialog>
		);
	}
}