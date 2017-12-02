import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link, withRouter } from 'react-router';
import './shuffleboard.scss';
import moment from 'moment'
import _ from 'underscore'
import * as d3 from 'd3'
import {
	// setBoardDimensions,
	startTurn,
	getBoardLength,
	getBoardWidth,
	getLengthOffset,
	TEAM_TYPES
} from 'app/actions/shuffleboard-actions'


const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {
	// setBoardDimensions,
	startTurn
})
@withRouter
export default class Shuffleboard extends Component {
	constructor() {
		super()

	}
	componentDidMount() {
		const {
			boardConfig: {
				devices,
				socketId
			},
			router,
			// setBoardDimensions,
			startTurn
		} = this.props

		if (_.isEmpty(devices)) {
			return router.push('/orientation')
		}

		//TODO: here determine board dimensions, direction, view window, and transform
		//determine full length and shortest width of board
		// let boardLength = 0
		// let boardWidth = Infinity
		// for(let deviceId in devices) {
		// 	const device = devices[deviceId]
		// 	// console.log("device: ", device)

		// 	if (device.directionY) {
		// 		boardLength += device.height

		// 		if(boardWidth > device.width) {
		// 			boardWidth = device.width
		// 		}
		// 	} else {
		// 		boardLength += device.width

		// 		if (boardWidth > device.height) {
		// 			boardWidth = device.height
		// 		}
		// 	}
		// }

		// //determine board offset
		// let lengthOffset = 0;
		// Object.values(devices).filter(device =>
		// 	device &&
		// 	device.timestamp &&
		// 	parseInt(device.timestamp) < parseInt(devices[socketId].timestamp)
		// ).forEach(device => {
		// 	lengthOffset += device.directionY
		// 		? device.height
		// 		: device.width
		// })

		// setBoardDimensions({
		// 	boardLength,
		// 	boardWidth,
		// 	lengthOffset
		// })

		setTimeout(startTurn, 1000)
	}

	componentDidUpdate() {
		this.drawBoard()
	}

	drawBoard() {
		const {
			boardConfig: {
				devices,
				socketId,
				// boardLength,
			 //  boardWidth,
			  // lengthOffset,
			  pucks
			},
			startTurn
		} = this.props
		const device = devices[socketId]
		const boardLength = getBoardLength(devices)
		const boardWidth = getBoardWidth(devices)
		const lengthOffset = getLengthOffset(socketId, devices)

		//NOTE: should not need margin
		//centering board takes care of it automatically
		// const margin = {top: 20, right: 20, bottom: 20, left: 20}

		// console.log("device: ", device)
		console.log("pucks: ", pucks)

		const svg = d3.select("#shuffleboard-svg")
		const g = svg.select(".inner-board")

		svg.attr("width", device.width)
			.attr("height", device.height)

		//BIG NOTE about transforming inner g
		// board dimensions need to be standard across all devices
		// so a board is flipped 90deg if yDirection = false plus 180deg if inverted

		const degOffset = (device.directionY ? 0 : -90) + (device.inverted ? 180 : 0)
		const xOrigin = boardWidth / 2
		const yOrigin = boardLength / 2
		let xTarget = device.directionY
			? boardWidth / 2
			: boardLength / 2
		let yTarget = device.directionY
			? boardLength / 2
			: boardWidth / 2

		//Center board
		//and account for lengthOffset
		if (device.directionY) {
			xTarget = device.width / 2
			yTarget -= lengthOffset
		} else {
			yTarget = device.height / 2
			xTarget -= lengthOffset
		}


		g.attr("transform", `translate(${xTarget - xOrigin}, ${yTarget - yOrigin}) rotate(${degOffset}, ${xOrigin}, ${yOrigin})`)

		//Board
		const board = g.selectAll(".board")
			.data([null])

		board.enter().append('rect')
			.attr("class", "board")
			.attr("x", 0)
			.attr("y", 0)
			.attr("height", boardLength)
			.attr("width", boardWidth)
			.style("stroke", "#000")
			.style("stroke-width", 4)
			.style("fill", "steelblue")
		.merge(board)
			.attr("height", boardLength)
			.attr("width", boardWidth)

		board.exit().remove()

		//Pucks

		//Force for pucks
		const simulation = d3.forceSimulation()
      .force("collide",d3.forceCollide(
      	function(d){
      		return d.r + 8
      	})
      		.iterations(16)
      		.strength(0.7)
      )
      .force("charge", null)
      .force("center", null)
      // .force("y", d3.forceY(0))
      // .force("x", d3.forceX(0))
      .velocityDecay(0.4) //Friction

    //hold internal state for faster tick
    //only update when pucks are updated
    this.pucks = [...pucks]



		const puckNodes = g.selectAll(".puck")
			.data(pucks)

		puckNodes.enter().append('circle')
			.attr("class", "puck")
			.attr("cx", d => d.x)
			.attr("cy", d => d.y)
			.attr("r", 20)
			.style("fill", d => {
				return d.team === TEAM_TYPES.RED
					? '#f44242'
					: '#4286f4'
			})
			.style("stroke", "#000")
			.style("stroke-width", 1.5)
			.call(d3.drag()
		    .on("start", dragstarted)
		    .on("drag", dragged)
		    .on("end", dragended)
		  )
		.merge(puckNodes)
			.attr("cx", d => d.x)
			.attr("cy", d => d.y)

		board.exit().remove()


		const ticked = function() {
      g.selectAll(".puck")
          .attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
	  }

	  simulation
      .nodes(pucks)
      .on("tick", ticked);

	  function dragstarted(d) {
      if (!d3.event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;

      console.log("dragstarted called")
    }
    
    function dragged(d) {
      d.fx = d3.event.x;
      d.x = d3.event.x
      d.fy = d3.event.y;
      d.y = d3.event.y

      console.log("d3.event.subject.vx: ", d3.event.subject.vx)
    }
    
    let lastX
    let lastY
    let lastTimestamp

    function dragended(d) {
      if (!d3.event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;

      console.log("dragended d.vx: ", d.vx)

      d.vx = 100;
      d.vy = 100;
    }
	}

  render() {
    return (
      <div className="shuffleboard-container" id="shuffleboard-container">
      	<svg id="shuffleboard-svg">
      		<g className="inner-board"/>
      	</svg>
      </div>
    );
  }
}
