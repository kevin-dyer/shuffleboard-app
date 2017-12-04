import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link, withRouter } from 'react-router';
import './shuffleboard.scss';
import moment from 'moment'
import _ from 'underscore'
import * as d3 from 'd3'
import {
	// setBoardDimensions,
	// updatePucks,
	startTurn,
	getBoardLength,
	getBoardWidth,
	getLengthOffset,
	TEAM_TYPES
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


function getRenderWidth (device, boardWidth, boardLength) {
	return device.directionY
		? boardWidth
		: boardLength
}

function getRenderHeight (device, boardWidth, boardLength) {
	return device.directionY
		? boardLength
		: boardWidth
}
function getRenderXMin (device, boardWidth, boardLength, lengthOffset) {

	if (device.directionY) {
		return 0
	} else {
		return lengthOffset
	}
}

function getRenderYMin (device, boardWidth, boardLength, lengthOffset) {
	if (device.directionY) {
		return lengthOffset
	} else {
		return 0
	}
}

function getRenderXMax (device, boardWidth, boardLength, lengthOffset) {


	if (device.directionY) {
		return boardWidth
	} else {

		// console.log("getRenderXMax lengthOffset: ", lengthOffset, ", device.width: ", device.width, ", boardLength: ", boardLength)
		return lengthOffset + device.width
	}
}

function getRenderYMax (device, boardWidth, boardLength, lengthOffset) {
	if (device.directionY) {
		return lengthOffset + device.height
	} else {
		return boardWidth
	}
}

function generatePuckMessage(pucks = [], device) {
	//NOTE: will need to transform everything depending on device.directionY
	console.log("generatePuckMessage pucks: ", pucks)
	return pucks.map(puck => ({
		angle: puck.angle,
		position: puck.position,
		velocity: puck.velocity
	}))
}

const stateToProps = ({boardConfig}) => ({
	boardConfig
})


@connect(stateToProps, {
	startTurn,
	// broadcastPucks
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
			startTurn,
			// broadcastPucks
		} = this.props
		const boardLength = getBoardLength(devices)
		const boardWidth = getBoardWidth(devices)
		const lengthOffset = getLengthOffset(socketId, devices)
		const device = devices[socketId]
		const shuffleboardCanvas = document.getElementById('shuffleboard-canvas')

		if (_.isEmpty(devices)) {
			return router.push('/orientation')
		}

		console.log("getRenderWidth(device, boardWidth, boardLength): ", getRenderWidth(device, boardWidth, boardLength))
		console.log("getRenderHeight(device, boardWidth, boardLength): ", getRenderHeight(device, boardWidth, boardLength))

		this.engine = Engine.create()
		this.world = this.engine.world
		this.renderMatter = Render.create({
			element: shuffleboardCanvas,
			engine: this.engine,
			options: {
				width: getRenderWidth(device, boardWidth, boardLength),
				height: getRenderHeight(device, boardWidth, boardLength),
				showAngleIndicator: true,
				pixelRatio: 1,
				background: '#fafafa',
				wireframeBackground: '#222',
				hasBounds: false,
				enabled: true,
				wireframes: true,
				showShadows: false
			}
		})

		this.world.gravity.y = 0

		Render.run(this.renderMatter)

		this.runner = Runner.create()
		Runner.run(this.runner, this.engine)

		// const stack = Composites.stack(20, 20, 10, 5, 0, 0, function(x, y) {
  //     let sides = Math.round(Common.random(1, 8));

  //     // triangles can be a little unstable, so avoid until fixed
  //     sides = (sides === 3) ? 4 : sides;

  //     // round the edges of some bodies
  //     var chamfer = null;
  //     if (sides > 2 && Common.random() > 0.7) {
  //         chamfer = {
  //             radius: 10
  //         };
  //     }

  //     switch (Math.round(Common.random(0, 1))) {
  //     case 0:
  //         if (Common.random() < 0.8) {
  //             return Bodies.rectangle(x, y, Common.random(25, 50), Common.random(25, 50), { chamfer: chamfer });
  //         } else {
  //             return Bodies.rectangle(x, y, Common.random(80, 120), Common.random(25, 30), { chamfer: chamfer });
  //         }
  //     case 1:
  //         return Bodies.polygon(x, y, sides, Common.random(25, 50), { chamfer: chamfer });
  //     }
  //   });

  	//TODO: use state.pucks to generate puck elements
  	const pucks = [
	  	{
	  		id: 0,
	  		x: device.directionY ? boardWidth / 2 : 50,
	  		y: device.directionY ? 50 : boardWidth / 2
	  	},
	  	{
	  		id: 1,
	  		x: device.directionY ? boardWidth / 2 + 50 : 50,
	  		y: device.directionY ? 50 : boardWidth / 2 + 50
	  	},
  	]
  	
  	this.puckElements = pucks.map(puck =>
  		Bodies.circle(puck.x, puck.y, 20, {
  			frictionAir: 0.01,
  			restitution: 0.9
  		})
  	)

    World.add(this.world, this.puckElements);

    const walls = device.directionY
    	? [
    			Bodies.rectangle(boardWidth / 2, 25, boardWidth, 50, { isStatic: true, restitution: 1, collisionFilter: {
              // mask: 'none'
           	} }), //TOP
    			Bodies.rectangle(boardWidth - 25, boardLength / 2, 50, boardLength, { isStatic: true, restitution: 1 }), //RIGHT
    			Bodies.rectangle(boardWidth / 2, boardLength - 25, boardWidth, 50, { isStatic: true, restitution: 1, collisionFilter: {
              // mask: 'none'
           	} }), //BOTTOM
    			Bodies.rectangle(25, boardLength / 2, 50, boardLength, { isStatic: true, restitution: 1 }), //left side
    		]
    	: [
    			Bodies.rectangle(boardLength / 2, 25, boardLength, 50, { isStatic: true, restitution: 1 }), //TOP
    			Bodies.rectangle(boardLength - 25, boardWidth / 2, 50, boardWidth, {
    				isStatic: true, restitution: 1,
    				collisionFilter: {
              // mask: 'none'
           	}
          }), //RIGHT
    			Bodies.rectangle(boardLength / 2, boardWidth - 25, boardLength, 50, { isStatic: true, restitution: 1 }), //BOTTOM
    			Bodies.rectangle(25, boardWidth / 2, 50, boardWidth, {
    				isStatic: true,
    				collisionFilter: {
              // mask: 'none'
           	},
           	restitution: 1
          }), //left side
    		]

    console.log("adding walls: ", walls)
    World.add(this.world, walls)

    // add mouse control
    this.mouse = Mouse.create(this.renderMatter.canvas)
    this.mouseConstraint = MouseConstraint.create(this.engine, {
        mouse: this.mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

    World.add(this.world, this.mouseConstraint);

    // keep the mouse in sync with rendering
    this.renderMatter.mouse = this.mouse;

    //Add Mouse move event listener
    let isListening = false
    Events.on(this.mouseConstraint, "mousedown", (e) => {
    	isListening = true
    })
    Events.on(this.mouseConstraint, "mousemove", (e) => {
    	// console.log("mousemove e: ", e.source.mouse)
    	//TODO: here broadcase all puck positions and velocities

    	if (this.puckElements && isListening) {
    		const nextPucks = generatePuckMessage(this.puckElements, device)

	    	broadcastPucks(nextPucks)
    	}

    })
    Events.on(this.mouseConstraint, "mouseup", (e) => {
    	isListening = false
    })

    // fit the render viewport to the scene
    Render.lookAt(this.renderMatter, {
        // min: {
        // 	x: getRenderXMin(device, boardWidth, boardLength, lengthOffset),
        // 	y: getRenderYMin(device, boardWidth, boardLength, lengthOffset)
        // },
        // max: {
        // 	x: getRenderXMax(device, boardWidth, boardLength, lengthOffset),
        // 	y: getRenderYMax(device, boardWidth, boardLength, lengthOffset)
        // }

        min: {
        	x: 0,
        	y: 0
        },
        max: {
        	x: getRenderWidth(device, boardWidth, boardLength),
        	y: getRenderHeight(device, boardWidth, boardLength)
        }
    });

		// console.log("xTarget: ", xTarget, ", xOrigin: ", xOrigin, ", yTarget: ", yTarget, ", yOrigin: ", yOrigin)
		// shuffleboardCanvas.style = `transform: translate(${xTarget - xOrigin}px, ${yTarget - yOrigin}px) rotate(${degOffset}deg);`
		// g.attr("transform", `translate(${xTarget - xOrigin}, ${yTarget - yOrigin}) rotate(${degOffset}, ${xOrigin}, ${yOrigin})`)

		shuffleboardCanvas.style = `transform: translate(${device.directionY ? 0 : -lengthOffset}px, ${device.directionY ? -lengthOffset : 0}px);`




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

		// setTimeout(startTurn, 1000)
	}

	componentDidUpdate({boardConfig: {pucks: oldPucks}}) {
		// this.drawBoard()

		const {boardConfig: {pucks}} = this.props

		if (pucks !== oldPucks){
			this.puckElements.forEach((puck, index) => {
				console.log("updating Body to puck: ", puck, ", pucks[index]: ", pucks[index])
				Body.setAngle(puck, pucks[index].angle)
				Body.setPosition(puck, pucks[index].position)
				Body.setVelocity(puck, pucks[index].velocity)
			})
		}
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
		// console.log("pucks: ", pucks)

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
      	<div id="shuffleboard-canvas">
      	</div>
      </div>
    );
  }
}
