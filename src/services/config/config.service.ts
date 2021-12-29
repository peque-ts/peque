import { NATIVE_SERVICES } from '../../models/constants/native-services';
import { Injector } from '../../models/dependency-injection/injector.service';

export class ConfigService {
  private storage = new Map<string, unknown>();

  set<TConfig>(storage: string, data: TConfig): void {
    this.storage.set(storage, data);
  }

  get<TConfig>(storage: string): TConfig {
    return this.storage.get(storage) as TConfig;
  }

  delete(storage: string): void {
    this.storage.delete(storage);
  }

  flush(): void {
    this.storage.clear();
  }
}

Injector.setNative('injectable', NATIVE_SERVICES.CONFIG, ConfigService);
export const Config = Injector.resolve<ConfigService>('injectable', NATIVE_SERVICES.CONFIG);
