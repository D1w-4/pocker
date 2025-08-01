const bodyParser = require('body-parser')
const express = require('express');
const server = express();
const jsonwebtoken = require('jsonwebtoken');
var {expressjwt} = require('express-jwt');
var Hand = require('./../game/hand');
const TableStore = require('../persistence/tables');
var SESSION_CONFIG = require('../../../shared/config/session.json');
const rateLimit = require('express-rate-limit');
const tableInfoMap = require('./tableInfoMap');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.resolve(__dirname, './openapi.yml'));

class ApiComponent {

}

const minBuyIn = 20
const maxBuyIn = 1000
const buyIn = 1000;

server.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

server.use(expressjwt({
  secret: SESSION_CONFIG.secret,
  algorithms: ['HS256'],
  getToken: function fromHeaderOrQuerystring(req) {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(' ')[0] === 'Bearer'
    ) {
      const token = req.headers.authorization.split(' ')[1];
      return token;
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  },
}).unless({path: ['/register']}))
server.use(bodyParser.json())

server.use(rateLimit({
  windowMs: 1000, // 1 секунда
  max: 2,
  keyGenerator: (req) => {
    return req.auth.uid;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    code: 429
  },
  skip: (req) => {
    return req.url.includes('/register')
  }
}))

const start = (port) => (app) => {
  const service = new ApiComponent()
  service.name = '__api__';

  server.post('/register', (req, res) => {
    app.rpc.game.authRemote.register(void 0, {
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
    }, function (e, user) {
      if (e) {
        res.status(400).send({
          code: 400,
          error: e
        })
        return;
      }
      res.json({
        token: jsonwebtoken.sign({uid: user.id}, SESSION_CONFIG.secret, {
          algorithm: 'HS256',
        })
      });
    });
  })

  server.post('/create-table', function (req, res) {
    const tableService = app.get('tableService')

    tableService.createTable(req.auth.uid, {
      smallBlind: 5,
      bigBlind: 10,
      minBuyIn,
      maxBuyIn,
      minPlayers: 2,
      maxPlayers: 10,
      gameMode: 'easy'
    }, function (err, board) {
      if (err) {
        return res.status(400).json({error: err, code: 400})
      }
      res.json(
        tableInfoMap(
          tableService.getTableJSON(board.id, req.auth.uid),
          req.auth.uid
        )
      );
    });
  })

  server.post('/join-table', function (req, res) {
    const pin = req.body.pin;
    const tableService = app.get('tableService')
    const tid = tableService.getTableIdByPin(pin);

    tableService.addPlayer(tid, req.auth.uid, buyIn, function (err) {
      if (err) {
        return res.status(400).json({error: err, code: 400})
      }
      return res.json(
        tableInfoMap(
          tableService.getTableJSON(tid, req.auth.uid),
          req.auth.uid
        )
      );
    })
  })

  server.post('/action', function (req, res) {
    const type = req.body.type; // call allin fold bet
    const pin = req.body.pin;
    const betAmount = req.body.betAmount;
    if (type == 'bet' && !betAmount) {
      res.status(400).json({error: 'BetAmount is required', code: 400})
    }
    const tableService = app.get('tableService');
    const tid = tableService.getTableIdByPin(pin);
    tableService.performAction(tid, req.auth.uid, {
      action: type,
      amt: betAmount
    }, (err) => {
      if (err) {
        return res.status(400).json({error: err, code: 400})
      }
      return res.json(
        tableInfoMap(
          tableService.getTableJSON(tid, req.auth.uid),
          req.auth.uid
        )
      );
    })
  })

  server.get('/table-info', function (req, res) {
    const pin = req.query.pin;
    const tableService = app.get('tableService')
    const tid = tableService.getTableIdByPin(pin);
    try {
      const tableInfo = tableService.getTableJSON(tid, req.auth.uid);
      if (!tableInfo) {
        throw 'Table not found';
      }
      return res.json(
        tableInfoMap(
          tableService.getTableJSON(tid, req.auth.uid),
          req.auth.uid
        )
      );
    } catch (err) {
      return res.status(400).json({error: err, code: 400})
    }
  })

  server.get('/table-stats', function (req, res) {
    TableStore.getByAttr('creator', req.auth.uid, (err, result) => {
      if (err) {
        return res.status(400).json({error: err, code: 400})
      } else {
        res.json(Array.isArray(result) ? result : [result]);
      }
    })
  })

  server.post('/rank', function (req, res) {
    const cards = req.body.cards;
    const hand = new Hand(cards);
    res.json({
      rank: hand.rank,
    });
  })
  server.listen(port, () => {
    console.log(`api running on port ${port}`);
  })
  return service;
}

module.exports = start
