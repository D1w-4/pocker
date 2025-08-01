const UserStore = require("../../../persistence/users");
const dispatcher = require("../../../util/dispatcher");
const TableStore = require("../../../persistence/tables");
var logger = require('pomelo-logger').getLogger('game-log', __filename);

module.exports = function (app) {
  return new Handler(app);
};
var Handler = function (app) {
  this.app = app;
};
var handler = Handler.prototype;

/**
 * Get tables
 *
 * @param {Object} msg game parameters from client
 * @param {Object} session
 * @param  {Function} next next step callback
 *
 */
handler.getTables = function (msg, session, next) {
  var tableService = this.app.get('tableService');
  next(null, {
    code: 200,
    route: msg.route,
    tables: tableService.getTables()
  });
};

/**
 * Create table
 *
 * @param {Object} msg game parameters from client
 * @param {Object} session
 * @param  {Function} next next step callback
 *
 */
handler.createTable = function (msg, session, next) {
  if (session.get('tid')) {
    next(null, {
      code: 500,
      error: 'already-in-table'
    });
    return;
  }
  this.app.get('tableService').createTable(session.uid, msg, function (e) {
    if (e) {
      next(null, {
        code: 500,
        error: e
      });
      return;
    }
    next(null, {
      code: 200,
      route: msg.route
    });
  });
};

var getSidByUid = function (uid, app) {
  var connector = dispatcher.dispatch(uid, app.getServersByType('connector'));
  if (connector) {
    return connector.id;
  }
  return null;
};

handler.getTable = function (msg, session, next) {
  var tableService = this.app.get('tableService');
  if (!session.uid) {
    next(null, {
      code: 401,
      error: 'unauthorized'
    });
    return;
  }
  UserStore.getByAttr('id', session.uid, {
    getFullEntity: true
  }, (err, member) => {
    if (!member.admin) {
      next(null, {
        code: 500,
        error: 'is not admin'
      });
      return;
    }
    next(null, {
      code: 200,
      route: msg.route,
      table: tableService.getTableJSON(msg.tid, void 0)
    });
  });
}
handler.startAdminGame = function (msg, session, next) {
  UserStore.getByAttr('id', session.uid, {
    getFullEntity: true
  }, (err, member) => {
    if (!member.admin) {
      next(null, {
        code: 500,
        error: 'is not admin'
      });
      return;
    }
    this.app.get('tableService').startGame(msg.tid, function (e) {
      if (e) {
        next(null, {
          code: 500,
          error: e
        });
      }
      next(null, {
        code: 200,
        route: msg.route
      });
    });
  });
};

handler.tableAdminStats = function (msg, session, next) {
  UserStore.getByAttr('id', session.uid, {
    getFullEntity: true
  }, (err, member) => {
    if (!member.admin) {
      next(null, {
        code: 500,
        error: 'is not admin'
      });
      return;
    }

    TableStore.getByAttr('tid', msg.tid, (err, result) => {
      if (err) {
        next(null, {
          code: 400,
          error: err
        });
      } else {
        next(null, {
          code: 200,
          result: Array.isArray(result) ? result : [result]
        });
      }
    })
  });
};

handler.joinAdminView = function (msg, session, next) {
  if (!session.uid) {
    next(null, {
      code: 401,
      error: 'unauthorized'
    });
    return;
  }
  UserStore.getByAttr('id', session.uid, {
    getFullEntity: true
  }, (err, member) => {
    if (!member.admin) {
      next(null, {
        code: 500,
        error: 'is not admin'
      });
      return;
    }
    var channelService = this.app.get('channelService');
    var channel = channelService.getChannel('admin-channel', true);
    var sid = getSidByUid(session.uid, this.app);

    if (!channel.getMember(session.uid)) {
      channel.add(session.uid, sid);
    }
    next(null, {
      code: 200,
      route: msg.route
    });
  });
}
/**
 * Join table
 *
 * @param {Object} msg table parameters from client
 * @param {Object} session
 * @param  {Function} next next step callback
 *
 */
handler.joinTable = function (msg, session, next) {
  var me = this;
  var tableService = this.app.get('tableService');
  var table = tableService.getTable(msg.tid);
  if (!msg.tid || !table) {
    next(null, {
      code: 500,
      error: 'invalid-table'
    });
    return;
  }
  session.set('tid', msg.tid);
  session.pushAll(function (err) {
    if (err) {
      logger.error('set tid for session service failed! error is : %j', err.stack);
      next(null, {
        code: 500,
        error: 'server-error'
      });
      return;
    }
    var tid = session.get('tid');
    me.app.rpc.chat.chatRemote.addToChannel(session, session.uid, tid, function (e) {
      if (e) {
        next(null, {
          code: 500,
          error: e
        });
        return;
      }
      tableService.addMember(tid, session.uid, function (e) {
        if (e) {
          next(null, {
            code: 500,
            error: e
          });
          return;
        }
        next(null, {
          code: 200,
          route: msg.route
        });
      });
    });
  });
};

/**
 * Leave table
 *
 * @param {Object} msg table parameters from client
 * @param {Object} session
 * @param  {Function} next next step callback
 *
 */
handler.leaveTable = function (msg, session, next) {
  var me = this;
  var tid = session.get('tid');
  if (!tid) {
    return next(null, {
      code: 500,
      error: 'not-table-member'
    });
  }
  me.app.rpc.chat.chatRemote.leave(session, session.uid, tid, function (e) {
  });
  session.set('tid', undefined);
  session.pushAll(function (e) {
    if (e) {
      logger.error('unset tid for session service failed! error is : %j', e.stack);
      return next(null, {
        code: 500,
        error: 'server-error'
      });
    }
    me.app.get('tableService').removeMember(tid, session.uid, function (e) {
      if (e) {
        next(null, {
          code: 500,
          error: e
        });
        return;
      }
      next(null, {
        code: 200,
        route: msg.route
      });
    });
  });
};

/**
 * Join game
 *
 * @param {Object} msg game parameters from client
 * @param {Object} session
 * @param  {Function} next next step callback
 *
 */
handler.joinGame = function (msg, session, next) {
  this.app.get('tableService').addPlayer(session.get('tid'), session.uid, msg.buyIn, function (e) {
    if (e) {
      next(null, {
        code: 500,
        error: e
      });
      return;
    }
    next(null, {
      code: 200,
      route: msg.route
    });
  });
};

/**
 * Start game
 *
 * @param {Object} msg game parameters from client
 * @param {Object} session
 * @param  {Function} next next step callback
 *
 */
handler.startGame = function (msg, session, next) {
  this.app.get('tableService').startGame(session.get('tid'), function (e) {
    if (e) {
      next(null, {
        code: 500,
        error: e
      });
    }
    next(null, {
      code: 200,
      route: msg.route
    });
  });
};

/**
 * Perform an action on your turn
 *
 * @param {Object} msg game parameters from client
 * @param {Object} session
 * @param  {Function} next next step callback
 *
 */
handler.execute = function (msg, session, next) {
  this.app.get('tableService').performAction(session.get('tid'), session.uid, msg, function (e) {
    if (e) {
      next(null, {
        code: 500,
        error: e
      });
    }
    next(null, {
      code: 200,
      route: msg.route
    });
  });
};

/**
 * Perform an action on your turn
 *
 * @param {Object} msg game parameters from client
 * @param {Object} session
 * @param  {Function} next next step callback
 *
 */
handler.removeBots = function (msg, session, next) {
  var botService = this.app.get('botService');
  botService.removeAllBots(session.get('tid'), true);
  next(null, {
    code: 200,
    route: msg.route
  });
};



