const USER = 'usuarioth';
const PASS = 'senhath';

exports.validate = (username, password) => {
  return username === USER && password === PASS;
};