/*
 * Functions
 */
const dispatch = (onEvent, status, method, message) => {
  if (typeof onEvent === 'function') {
    onEvent({ status, method, message });
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
  },
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
