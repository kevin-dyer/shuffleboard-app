import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link } from 'react-router';
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

@connect(stateToProps, {})
export default class ConfigureBoard extends Component {
	constructor() {
		super()

		this.state = {touches: []}
	}
	componentDidMount() {
		// console.log("Configure board mounted")

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

    // console.log("svg: ", svg)
		this.throttledUpdate = _.throttle(::this.updateBoardConfiguration, 200)
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

    // console.log("this.state: ", this.state, ", d: ", d)
    const stateTouches = this.state.touches

    //NOTE: this looks bad - trace skips
    //TODO: find distance between d and the last point in stateTouches, only go forward if far enough apart
    // if (stateTouches[0] && stateTouches[0].length && distance(stateTouches[0][stateTouches[0].length - 1], d) < 20) {
    // 	console.log("skipping mousemove")
    // 	return
    // }

    // console.log("d: ", d)
    const touches = stateTouches && stateTouches.length > 0
    	? stateTouches.map((finger, index) => {
		    	return [
		    		...finger,
		    		d //assuming only one mouse
		    	]
		    })
    	: [[d]]

    // console.log("next touches: ", touches)

    this.setState({
    	touches
    }, () => {
    	this.updateFingerTrace()
    	this.throttledUpdate()
    	// this.updateBoardConfiguration()
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
		console.log("updateBoardConfiguration called")
		// const {broadcastConfig} = this.props
		//TODO: update board config and broadcast it
		//First, determine direction (broken down into directionY and inverted)
		const {boardConfig: {socketId}} = this.props
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

		//use direction, window dimension, 

		//TODO: need timestamp
		const boardConfig = {
			id: socketId,
			directionY,
			inverted,
			firstTouch, //TODO: replace these with pixel density
			lastTouch,
			timestamp: moment().valueOf()
		}

		broadcastConfig(boardConfig)
	}

  render() {
    return (
      <div className="configure-board-container">
        <svg className="board-svg"/>
      </div>
    );
  }
}
