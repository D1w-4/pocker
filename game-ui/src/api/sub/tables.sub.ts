import { PokerTable } from 'api/models/Table.model';
import { BehaviorSubject } from 'rxjs';

export const tables$ = new BehaviorSubject<Array<PokerTable>>([]);
