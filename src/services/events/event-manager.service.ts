import 'reflect-metadata';
import EventEmitter from 'events';
import { OnEventInterface } from '../../decorators';
import { NATIVE_SERVICES } from '../../models/constants/native-services';
import { Injector } from '../../models/dependency-injection/injector.service';
import { NativeEventsType } from '../../models';
import { Subject } from 'rxjs';

export interface EventPayload<TData> {
  event: string | NativeEventsType;
  timestamp: number;
  data: TData;
}

export interface LifeCycleEvent<TData> {
  event: NativeEventsType;
  data: TData;
}

export const LifeCycleEventEmitter = new Subject<LifeCycleEvent<unknown>>();

export class EventManagerService {
  private emitter = new EventEmitter();

  constructor() {
    LifeCycleEventEmitter.subscribe((event: LifeCycleEvent<unknown>) => {
      if (event) {
        this.push(event.event, event.data);
      }
    });
  }

  register(value: OnEventInterface) {
    this.emitter.addListener(value.event, value.listener)
  }

  push<TData>(event: string | NativeEventsType, data: TData): void {
    const payload: EventPayload<TData> = { event, timestamp: Date.now(), data };
    this.emitter.emit(event, payload);
  }

  subscribe<TData>(event: string | NativeEventsType, listener: (data: EventPayload<TData>) => void): void {
    this.emitter.on(event, listener);
  }
}

Injector.setNative(NATIVE_SERVICES.EVENT_MANAGER, new EventManagerService(), [], false);

export const EventManager = Injector.resolve<EventManagerService>(NATIVE_SERVICES.EVENT_MANAGER);
