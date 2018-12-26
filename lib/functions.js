/*
* Functions
*/
const dispatch = (onEvent, type, method, message) => {
  if (onEvent === 'function') {
    onEvent({
      status: 'error',
      method: method,
      message: message
    });
  }
};

module.exports = {
  success(onEvent, method, message = '') {
    dispatch(onEvent, 'success', method, message);
  },
  error(onEvent, method, message = '') {
    dispatch(onEvent, 'error', method, message);
  },
  info(onEvent, method, message = '') {
    dispatch(onEvent, 'info', method, message);
  },
  progress(onEvent, method, message = '') {
    dispatch(onEvent, 'progress', method, message);
  }
};
