import React, { PropTypes } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
 import './app.scss';
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();



const App = (props) => (
  <div className="page-container">
  	<MuiThemeProvider>
    	{React.cloneElement({...props}.children, {...props})}
    </MuiThemeProvider>
  </div>
);

App.propTypes = {
  children: PropTypes.element.isRequired
};

export default App;
