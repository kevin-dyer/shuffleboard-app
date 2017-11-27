import React, { Component } from 'react';
import {connect} from 'react-redux';
import { Link, withRouter } from 'react-router';
import * as d3 from 'd3';
import './shuffleboard.scss';
import moment from 'moment'
import _ from 'underscore'
// import * as Matter from 'matter-js'
import {
	Engine,
	Render,
	Runner,
	Composites,
	MouseConstraint,
	Mouse,
	World,
	Constraint,
	Bodies
} from 'matter-js'
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
			} {
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

		console.log("boardLength: ", boardLength, ", boardWidth: ", boardWidth, ", lengthOffset: ", lengthOffset)
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

		console.log("device: ", device)
    // create engine
    var engine = Engine.create(),
        world = engine.world;

    // create renderer
    var render = Render.create({
        element: document.getElementById("shuffleboard-container"),
        engine: engine,
        options: {
            // width: device.directionY ? boardWidth : boardLength,
            // height: device.directionY ? boardLength : boardWidth,
            width: 800,
            height: 600,
            showAngleIndicator: true
        }
    });

    Render.run(render);

    // create runner
    var runner = Runner.create();
    Runner.run(runner, engine);

    // add bodies
    // var rows = 10,
    //     yy = 600 - 21 - 40 * rows;
    
    // var stack = Composites.stack(400, yy, 5, rows, 0, 0, function(x, y) {
    //     return Bodies.rectangle(x, y, 40, 40);
    // });
    
    World.add(world, [
        // stack,
        // walls
        Bodies.rectangle(
        	0,
        	0,
        	device.directionY ? 50 : device.width,
        	device.directionY ? device.height : 50,
        	{ isStatic: true }
        ),
        Bodies.rectangle(
        	device.directionY
        		? device.width - 50
        		: 0,
        	device.directionY
        		? 0
        		: device.height - 50,
        	device.directionY ? 50 : device.width,
        	device.directionY ? device.height : 50,
        	{ isStatic: true }
        )
    ]);
    
    var ball = Bodies.circle(100, 400, 50, { density: 0.04, frictionAir: 0.005});
    
    World.add(world, ball);
    // World.add(world, Constraint.create({
    //     pointA: { x: 300, y: 100 },
    //     bodyB: ball
    // }));

    // add mouse control
    var mouse = Mouse.create(render.canvas),
        mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

    World.add(world, mouseConstraint);

    // keep the mouse in sync with rendering
    render.mouse = mouse;

    // fit the render viewport to the scene
    Render.lookAt(render, {
        min: {
        	// x: device.directionY
	        // 	? 0
	        // 	: lengthOffset,
        	// y: device.directionY
	        // 	?	lengthOffset
	        // 	: 0
	        x: 0, y: 0
        },
        max: {
        	// x: device.directionY
	        // 	? device.width
	        // 	: lengthOffset + device.width,
        	// y: device.directionY
	        // 	? lengthOffset + device.height
	        // 	: device.height
	        x: 800, y: 600
        }
    });
	}

  render() {
    return (
      <div className="shuffleboard-container" id="shuffleboard-container">
        This is the shuffleboard!!!
      </div>
    );
  }
}
