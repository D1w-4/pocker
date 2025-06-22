const bodyParser = require('body-parser')
const express = require('express');
const server = express();
const jsonwebtoken = require("jsonwebtoken");
var {expressjwt} = require("express-jwt");

var SESSION_CONFIG = require('../../../shared/config/session.json');

class ApiComponent {

}

const minBuyIn = 20
const maxBuyIn = 1000
const buyIn = 1000;
server.use(expressjwt({
  secret: SESSION_CONFIG.secret,
  algorithms: ["HS256"],
  getToken: function fromHeaderOrQuerystring(req) {
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      const token = req.headers.authorization.split(" ")[1];
      return token;
    } else if (req.query && req.query.token) {
      return req.query.token;
    }
    return null;
  },
}).unless({path: ["/register"]}))
server.use(bodyParser.json())

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
      console.log('reg', user);
      res.json({
        token: jsonwebtoken.sign({uid: user.id}, SESSION_CONFIG.secret, {
          algorithm: "HS256",
        })
      });
    });

    // UserStore.create({
    //   username: req.body.username,
    // }, (error, user) => {
    //   if (error) {
    //     res.status(500).send({error})
    //     return;
    //   }
    //   const jwtStr = jsonwebtoken.sign(
    //     {id: user.id, username: user.username},
    //     secret,
    //     {expiresIn: "30 days"}
    //   )
    //   res.json({token: jwtStr});
    // })
  })

  server.get("/bords", function (req, res) {
    const tableService = app.get('tableService')
    res.json(tableService.getTables());
  })

  server.post('/create-table', function (req, res) {
    const tableService = app.get('tableService')
    tableService.createTable(req.auth.uid, {
      smallBlind: 5,
      bigBlind: 10,
      minBuyIn,
      maxBuyIn,
      minPlayers: 2,
      maxPlayers: 10
    }, function (err, board) {
      if (err) {
        return res.status(400).send(JSON.stringify({error: err, code: 400}))
      }
      res.json(
        tableService.getTableJSON(board.id, req.auth.uid)
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
      return res.json(tableService.getTableJSON(tid, req.auth.uid));
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
      return res.json(tableService.getTableJSON(tid, req.auth.uid));
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
      return res.json(tableInfo);
    } catch (err) {
      return res.status(400).json({error: err, code: 400})
    }

  })

  server.listen(port, () => {
    console.log(`api running on port ${port}`);
  })
  return service;
}

module.exports = start
