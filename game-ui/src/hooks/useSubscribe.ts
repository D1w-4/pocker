import { useEffect, useState } from 'react';
import { BehaviorSubject, Observable } from 'rxjs';

type TSubjects<Type> = BehaviorSubject<Type> | Observable<Type>;

export function useSubscribe<Type>(sub: TSubjects<Type>, defaultValue?: Type): Type {
  const initialValue = sub instanceof BehaviorSubject ? (sub.value as Type) : defaultValue as Type;
  const [value, setValue] = useState<Type>(initialValue);
  useEffect(() => {
    const subscription = sub.subscribe((val: Type) => setValue(val));

    return () => subscription.unsubscribe();
  }, [setValue, sub]);

  return value;
}
