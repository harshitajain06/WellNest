import React from 'react';
import GradientBackground from './GradientBackground';

const withGradient = (Component) => (props) => (
  <GradientBackground>
    <Component {...props} />
  </GradientBackground>
);

export default withGradient;
