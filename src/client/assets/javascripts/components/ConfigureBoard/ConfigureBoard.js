import React, { Component } from 'react';
import { Link } from 'react-router';
import 'ConfigureBoard.scss';

export default class ConfigureBoard extends Component {
  render() {
    return (
      <div className="configure-board-container">
        <svg className="board-svg"/>
      </div>
    );
  }
}
