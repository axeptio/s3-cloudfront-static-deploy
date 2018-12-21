/*
* Functions
*/
module.exports = {

  success(action) {
    return {
      status: 'Success',
      methode: action
    };
  },

  error(action, message) {
    return {
      status: 'Error',
      methode: action,
      message: message
    };
  }
};
