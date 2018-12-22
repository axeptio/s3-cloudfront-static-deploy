/*
* Functions
*/
module.exports = {

  success(method, message = '') {
    return {
      status: 'Success',
      method: method,
      message: message
    };
  },

  error(method, message = '') {
    return {
      status: 'Error',
      method: method,
      message: message
    };
  }
};
