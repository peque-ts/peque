import { LifeCycleService } from '../../services/life-cycle/life-cycle.service';

type ProviderClass = { new (...args: unknown[]): unknown };
type ProviderInstance = InstanceType<ProviderClass>;

class InjectorService {
  private providers = new Map<string, ProviderInstance>();

  resolve<TProvider extends ProviderInstance>(provider: string): TProvider {
    const matchedProvider = this.providers.get(provider) as TProvider;

    if (!matchedProvider) {
      throw new Error(`No provider found for ${provider}!`);
    }

    return matchedProvider;
  }

  async set(provider: string, target: ProviderClass, dependencies: ProviderInstance[] = []): Promise<void> {
    if (this.providers.has(provider)) {
      return;
    }

    const instance = new target(...dependencies);
    await Promise.resolve(LifeCycleService.triggerProviderInit(instance));
    this.providers.set(provider, instance);
  }

  setNative(provider: string, target: ProviderClass, dependencies: ProviderInstance[] = []): void {
    if (!this.providers.get(provider)) {
      const instance = new target(...dependencies);
      this.providers.set(provider, instance);
    }
  }

  getProviders(): Map<string, ProviderInstance> {
    return this.providers;
  }
}

export const Injector = new InjectorService();
