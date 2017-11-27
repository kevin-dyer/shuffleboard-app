import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link, withRouter } from 'react-router';
// import {withRouter} from 'react-router-dom';
import * as d3 from 'd3';
import './ConfigureBoard.scss';
import {broadcastConfig} from 'app/actions/socket-actions';
import moment from 'moment'
import _ from 'underscore'
function distance ([x0, y0], [x1, y1]) {
	return Math.pow((Math.pow((y1 - y0), 2) + Math.pow((x1 - x0), 2)), 0.5)
}

const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {broadcastConfig})
@withRouter
export default class ConfigureBoard extends Component {
	constructor() {
		super()

		this.state = {touches: []}
	}
	componentDidMount() {
		const bodyElement = d3.select("body")
	    .on("touchstart", this.nozoom)
	    .on("touchmove", this.nozoom)

	  const width = document.body.offsetWidth
	  const height = document.body.offsetHeight
	  console.log("width: ", width, ", height: ", height)

		const svg = d3.select('.board-svg')
			.attr("width", width)
			.attr("height", height)
			// .on("touchstart", this.touchHandler)
   //  	.on("touchmove", this.touchHandler)
    	// .on("mousedown", this.mouseHandler)
    	.on("mousemove", ::this.mouseHandler);

		this.throttledUpdate = _.debounce(::this.updateBoardConfiguration, 200, false)
	}

	componentDidUpdate() {
		const {
			boardConfig: {
				socketId,
				devices,
				userCount
			},
			router
		} = this.props

		if (Object.keys(devices).length === userCount) {
			console.log("Update is complete, redirect to game!")
			router.push('/shuffleboard')
		}
	}

	// touchHandler() {
	// 	d3.event.preventDefault();
 //    d3.event.stopPropagation();
 //    const d = d3.touches(this);

 //    console.log("touch d: ", d)


 //    const touches = this.state.touches.map((finger, index) => {
 //    	return [
 //    		...finger,
 //    		d[index]
 //    	]
 //    })

 //    this.setState({
 //    	touches
 //    }, () => {
 //    	this.updateFingerTrace()
 //    })
	// }

	mouseHandler() {
		d3.event.preventDefault();
    d3.event.stopPropagation();
    const svg = d3.select(".board-svg")
    const d = d3.mouse(svg.node());
    const stateTouches = this.state.touches
    const touches = stateTouches && stateTouches.length > 0
    	? stateTouches.map((finger, index) => {
		    	return [
		    		...finger,
		    		d //assuming only one mouse
		    	]
		    })
    	: [[d]]

    this.setState({
    	touches
    }, () => {
    	this.updateFingerTrace()
    	this.throttledUpdate()
    })
	}

	nozoom (){
		d3.event.preventDefault();
	}

	updateFingerTrace() {
		const line = d3.line()
		  // .x(d => d[0])
		  .x(d => {
		  	// console.log("line x, d: ", d)
		  	return d[0]
		  })
		  .y(d => d[1])
		  .curve(d3.curveBasis)

		// console.log("updateFingerTrace. this.state: ", this.state)

		const traces = d3.select('.board-svg').selectAll('.finger-trace')
			.data(this.state.touches)

		traces.enter().append('path')
			.attr("class", "finger-trace")
			.style("stroke", "rgba(0,0,0,0.2)")
			.style("stroke-width", 25)
			.style("fill", "none")

		.merge(traces)
			.attr("d", line)
	}

	updateBoardConfiguration() {
		const {
			boardConfig: {
				socketId,
				devices,
				userCount
			},
			broadcastConfig,
			router
		} = this.props
		const {touches} = this.state
		const firstFinger = touches[0]
		if (!firstFinger) {
			console.log("cannot update board configurations without first finger data")
			return
		}

		const deltaX = firstFinger[firstFinger.length - 1][0] - firstFinger[0][0]
		const deltaY = firstFinger[firstFinger.length - 1][1] - firstFinger[0][1]

		const directionY = Math.abs(deltaY) > Math.abs(deltaX) //if in Y direction (default)
		const inverted = directionY
			? deltaY < 0
			: deltaX < 0

		//Next determine pixel offset - this is more difficult and will require getting all board configurations
		//Can store first and last x and y values
		const firstTouch = touches.map(touchStream => touchStream[0])
		const lastTouch = touches.map(touchStream => touchStream[touchStream.length - 1])
		const firstFingerDist = this.getFingerDistance(firstTouch, directionY)
		const lastFingerDist = this.getFingerDistance(lastTouch, directionY)
		
		console.log("firstFingerDist: ", firstFingerDist, ", lastFingerDist: ", lastFingerDist)

		//TODO: can compare boardConfig.devices[0].lastFingerDist to firstFingerDist to get the px multiplier
		//but skip for now, not even sure this is necessary
		const boardConfig = {
			id: socketId,
			directionY,
			inverted,
			firstTouch, //TODO: replace these with pixel density
			lastTouch,
			firstFingerDist,
			lastFingerDist,
			width: window.innerWidth,
			height: window.innerHeight,
			timestamp: moment().valueOf()
		}

		broadcastConfig(boardConfig)

		//TODO: this should be moved into didRee
		//determine if update is finished (devices.length === userCount && )
		// console.log("devices: ", devices, ", userCount: ", userCount, ", ===: ", Object.keys(devices).length === userCount)
		// if (Object.keys(devices).length === userCount) {
		// 	console.log("Update is complete, redirect to game!")
		// 	//should redirect to game board and use devices to create a new game board object
		// 	//this will define order and dimensions of board
		// 	// console.log("history: ", history)
		// 	router.push('/shuffleboard')
		// }
	}

	getFingerDistance(touchPoints, directionY) {
		if (touchPoints.length !== 2) return null

		return directionY
			? Math.abs(touchPoints[0][0] - touchPoints[1][0])
			: Math.abs(touchPoints[0][1] - touchPoints[1][1])
	}

  render() {
    return (
      <div className="configure-board-container">
        <svg className="board-svg"/>
      </div>
    );
  }
}
