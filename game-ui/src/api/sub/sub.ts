import { UserProfile } from 'api/models/User.model';
import { BehaviorSubject } from 'rxjs';

export const user$ = new BehaviorSubject<null | UserProfile>(null)
