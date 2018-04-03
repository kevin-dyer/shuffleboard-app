import React, { Component } from 'react';
import {connect} from 'react-redux';
import { push } from 'react-router-redux'
// import IconButton from 'material-ui/IconButton'
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog'
import TextField from 'material-ui/TextField';
// import {showAllowJoinModal} from 'app/actions/shuffleboard-actions'

// import _ from 'underscore'
// import {

// } from 'app/actions/shuffleboard-actions'
import {startGame, joinGame} from 'app/actions/socket-actions'


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
        title={`Game PIN: ${roomPin}`}
        open={true}
        onRequestClose={()=>{}}
      >
        <div>
        	<div className="clients">
        		{clients.length} clients
        	</div>
        	<RaisedButton
        		label="Start Game"
        		onClick={::this.handleStartGame}
        	/>
        </div>
      </Dialog>
		);
	}
}