var UserStore = require('../../../persistence/users');
var SESSION_CONFIG = require('../../../../../shared/config/session.json');
const jsonwebtoken = require("jsonwebtoken");

module.exports = function (app) {
  return new Remote(app);
};
var Remote = function (app) {
  this.app = app;
};
var remote = Remote.prototype;

/**
 * Register user.
 *
 * @param  {object}   userObj object containing userObj.user and userObj.pass
 * @param  {Function} cb
 * @return {Void}
 */
remote.register = function (userObj, cb) {
  UserStore.create({
    username: userObj.username,
    password: userObj.password,
    email: userObj.email,
    chips: 100_000
  }, function (e, user) {
    if (e) {
      cb(e);
    } else {
      cb(null, user);
    }
  });
};
/**
 * Auth via user/pass or token, and check for expiry.
 *
 * @param  {object|string}   input token or object containing username and password
 * @param  {Function} cb
 * @return {Void}
 */
remote.auth = function (input, cb) {
  if (input?.token) {
    var res;
    try {
      res = jsonwebtoken.verify(input.token, SESSION_CONFIG.secret)
    } catch (e) {
      res = void 0
    }
    if (!res) {
      cb('invalid-token');
      return;
    }

    UserStore.getByAttr('id', res.uid, false, function (e, user) {
      if (e) {
        cb('invalid-user');
        return;
      }
      cb(null, user);
    });
  } else {
    UserStore.getByAttr(['username', 'password'], [input.username, input.password], false, function (e, user) {
      if (!user) {
        cb('invalid-user');
      } else {
        const token = jsonwebtoken.sign({uid: user.id}, SESSION_CONFIG.secret, {
          algorithm: 'HS256',
        });
        cb(null, user, token);
      }
    });
  }
};

