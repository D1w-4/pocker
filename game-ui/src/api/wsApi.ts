import { UserProfile } from 'api/models/User.model';
import { PomeloClient } from 'api/PomeloClient';
import { tables$ } from 'api/sub/tables.sub';
import { BehaviorSubject } from 'rxjs';

export class WsApi {
  client: PomeloClient;
  user$: BehaviorSubject<any | null> = new BehaviorSubject(null);
  onConnect: Promise<void>;

  constructor() {
    const client = new PomeloClient();
    this.client = client;
    const connectionClient = new PomeloClient();
    this.onConnect = new Promise<void>((resolve, reject) => {
      connectionClient.init({
        host: window.location.hostname,
        port: 3014
      }, () => {
        connectionClient.request('gate.gateHandler.queryEntry', {}, (res) => {

          client.init({
            host: res.host,
            port: res.port
          }, () => {
            console.log('connected successfully');
            resolve();
          });
        });
      });
    }).then(() => console.log('done'));
  }

  setToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  async auth(username: string, password: string, cb?: (data: any) => void) {
    const client = await this.client;
    client.request('connector.entryHandler.connect', {
      username,
      password
    }, (data) => {
      this.user$.next(data.user);
      this.joinAdminView(() => {
        console.log('joinedAdminView');
      });
      this.setToken(data.token);
      cb && cb(data);
    });
  }

  refresh(cb?: (data: any) => void) {
    const client = this.client;
    client.request('connector.entryHandler.connect', {
      token: this.getToken()
    }, (data) => {
      this.user$.next(data.user);
      this.joinAdminView(() => {
        console.log('joinedAdminView');
      });
      cb && cb(data);
    });
  }

  joinAdminView(cb: () => void) {
    const client = this.client;
    client.request('game.tableHandler.joinAdminView', {}, cb);
  }

  getUsers(cb: (arg: Array<UserProfile>) => void) {
    const client = this.client;
    return client.request('game.userHandler.getAllUsers', {}, (res) => {
      cb(res.matches);
    });
  }

  getTables() {
    const client = this.client;
    client.request('game.tableHandler.getTables', {}, (res) => {
      tables$.next(res.tables.tables);
    });
    return tables$;
  }

  onBroadcastTable(tid: string, cb?: (data: any) => void) {
    const client = this.client;
    return client.on(`broadcastGameState.${tid}`, (data) => {
      cb && cb(data.data);
    });
  }

  onUpdateTable() {
    const client = this.client;
    return client.on('updateTable', (res) => {
      tables$.next([
        res.data,
        ...tables$.value
      ]);
    });
  }

  createTable(cb: (arg: any) => void) {
    const client = this.client;
    client.request('game.tableHandler.createTable', {
      smallBlind: 5,
      bigBlind: 10,
      minBuyIn: 20,
      maxBuyIn: 1000,
      minPlayers: 2,
      maxPlayers: 10
    }, (res) => {
      if (res.error) {
        cb(res.error);
        return;
      }
      cb(res.table);
    });
  }

  getTable(tid: string, cb?: (arg: any) => void) {
    const client = this.client;
    client.request('game.tableHandler.getTable', { tid }, (res) => {
      cb && cb(res.table);
    });
  }

  tableStats(tid: string, cb?: (arg: any) => void) {
    const client = this.client;
    client.request('game.tableHandler.tableAdminStats', { tid }, (res) => {
      cb && cb(res.result);
    });
  }

  startGame(tid: string) {
    const client = this.client;
    client.request('game.tableHandler.startAdminGame', { tid }, (res) => {
      console.log('joined', res);
    });
  }
}

export const wsApi = new WsApi();
