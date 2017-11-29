import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link, withRouter } from 'react-router';
import './shuffleboard.scss';
import moment from 'moment'
import _ from 'underscore'
import * as d3 from 'd3'
import {setBoardDimensions} from 'app/actions/shuffleboard-actions'


const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {setBoardDimensions})
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
			setBoardDimensions
		} = this.props

		if (_.isEmpty(devices)) {
			return router.push('/orientation')
		}

		//TODO: here determine board dimensions, direction, view window, and transform
		//determine full length and shortest width of board
		let boardLength = 0
		let boardWidth = Infinity
		for(let deviceId in devices) {
			const device = devices[deviceId]
			// console.log("device: ", device)

			if (device.directionY) {
				boardLength += device.height

				if(boardWidth > device.width) {
					boardWidth = device.width
				}
			} else {
				boardLength += device.width

				if (boardWidth > device.height) {
					boardWidth = device.height
				}
			}
		}

		//determine board offset
		let lengthOffset = 0;
		Object.values(devices).filter(device =>
			device &&
			device.timestamp &&
			parseInt(device.timestamp) < parseInt(devices[socketId].timestamp)
		).forEach(device => {
			lengthOffset += device.directionY
				? device.height
				: device.width
		})

		setBoardDimensions({
			boardLength,
			boardWidth,
			lengthOffset
		})
	}

	componentDidUpdate() {
		this.drawBoard()
	}

	drawBoard() {
		const {
			boardConfig: {
				devices,
				socketId,
				boardLength,
			  boardWidth,
			  lengthOffset
			}
		} = this.props
		const device = devices[socketId]
		const margin = {top: 20, right: 20, bottom: 20, left: 20}

		console.log("device: ", device)

		const svg = d3.select("#shuffleboard-svg")
		const g = svg.select(".inner-board")

		svg.attr("width", device.width)
			.attr("height", device.height)

		//BIG NOTE about transforming inner g
		// board dimensions need to be standard across all devices
		// so a board flipped 90deg needs to pretend that its inner.width is actually its height

		// const xGOffset = device.directionY
		// 	? (device.width - boardWidth) * 0.5
		// 	: -lengthOffset
		// const yGOffset = device.directionY
		// 	? -lengthOffset
		// 	: (device.height - boardWidth) * 0.5
		const xGOffset = (device.width - boardWidth) * 0.5
		const yGOffset = -lengthOffset
		const degOffset = (device.directionY ? 0 : 90) + (device.inverted ? 180 : 0)
		// const xOrigin = device.directionY
		// 	? boardWidth / 2
		// 	: boardLength / 2
		// const yOrigin = device.directionY
		// 	? boardLength / 2
		// 	: boardWidth / 2 
		// const xOrigin = boardWidth / 2
		// const yOrigin = boardLength / 2
		const xOrigin = device.width / 2
		const yOrigin = device.height / 2

		// g.attr("transform", `translate(${xGOffset + margin.left}, ${yGOffset + margin.top}) rotate(${degOffset}, ${xOrigin}, ${yOrigin})`)
		// g.attr("transform", `translate(${xGOffset + margin.left}, ${yGOffset + margin.top})`)
		
		console.log("degOffset: ", degOffset, ", xOrigin: ", xOrigin, ", yOrigin: ", yOrigin)
		g.attr("transform", `translate(${xGOffset}, ${yGOffset}) rotate(${degOffset}, ${xOrigin}, ${yOrigin})`)
		// g.attr("transform", `translate(${margin.left}, ${margin.top})`)

		//update
		const board = g.selectAll(".board")
			.data([null])

		board.enter().append('rect')
			.attr("class", "board")
			// .attr("x", device.directionY
			// 	? (device.width - boardWidth) * 0.5
			// 	: 0
			// )
			.attr("x", 0)
			// .attr("y", device.directionY
			// 	? -lengthOffset
			// 	: (device.height - boardWidth) * 0.5
			// )
			.attr("y", 0)
			// .attr("height", (device.directionY ? boardLength  : boardWidth) - margin.top - margin.bottom)
			// .attr("width", (device.directionY ? boardWidth : boardLength) - margin.left - margin.right)
			// .attr("height", boardLength - margin.top - margin.bottom)
			// .attr("width", boardWidth - margin.left - margin.right)
			.attr("height", boardLength)
			.attr("width", boardWidth)
			.style("stroke", "#000")
			.style("stroke-width", 4)
			.style("fill", "steelblue")


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
