const BotService = require("../services/botService");
const bodyParser = require('body-parser')
var uuid = require('node-uuid');
const express = require('express');
const server = express();
const jsonwebtoken = require("jsonwebtoken");
var {expressjwt} = require("express-jwt");
const UserStore = require("./../persistence/users");

class ApiComponent {

}

const secret = 'kek42';
const minBuyIn = 999;
const maxBuyIn = 1001;
const buyIn = 1000;
server.use(expressjwt({
  secret,
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
}).unless({path: ["/reg"]}))
server.use(bodyParser.json())

const start = (port) => (app) => {
  const service = new ApiComponent()
  service.name = '__api__';

  server.post('/reg', (req, res) => {
    UserStore.create({
      username: req.body.username,
    }, (error, user) => {
      if (error) {
        res.status(500).send({error})
        return;
      }
      const jwtStr = jsonwebtoken.sign(
        {id: user.id, username: user.username},
        secret,
        {expiresIn: "30 days"}
      )
      res.json({token: jwtStr});
    })
  })

  server.get("/bords", function (req, res) {
    const tableService = app.get('tableService')
    res.send(JSON.stringify(tableService.getTables()));
  })

  server.post('/create-table', function (req, res) {
    const tableService = app.get('tableService')
    tableService.createTable(req.auth.id, {
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
        tableService.getTableJSON(board.id, req.auth.id)
      );
    });
  })
  server.post('/join-table', function (req, res) {
    const pin = req.body.pin;
    const tableService = app.get('tableService')
    const tid = tableService.getTableIdByPin(pin);

    tableService.addPlayer(tid, req.auth.id, buyIn, function (err) {
      if (err) {
        return res.status(400).json({error: err, code: 400})
      }
      return res.json(tableService.getTableJSON(tid, req.auth.id));
    })
  })
  server.get('/table-info', function (req, res) {
    const pin = req.query.pin;
    const tableService = app.get('tableService')
    const tid = tableService.getTableIdByPin(pin);
    try {
      const tableInfo = tableService.getTableJSON(tid, req.auth.id);
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
