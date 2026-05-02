const React = require('react');

const MockCamera = React.forwardRef((props, ref) => React.createElement('Camera', { ...props, ref }));

module.exports = {
  Camera: MockCamera,
  useCameraDevices: () => [],
  useCameraDevice: () => null,
  useFrameProcessor: () => jest.fn(),
};



