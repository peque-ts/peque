import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { CacheManager, HttpClient } from '../models';
import { NATIVE_SERVICES } from '../models/constants/native-services';
import { Injector } from '../models/dependency-injection/injector.service';
import { Providers } from '../models/dependency-injection/provider.service';
import { HttpService } from '../services';
import { loadInjectables } from '../utils/dependencies.utils';
import { Inject, Injectable } from './injectable';

const test = suite('Injectable');

test.before.each(() => {
  Providers.unsetAll();
});

test('@Injectable should make the decorated class available via dependency injection', async () => {
  @Injectable()
  class TestService {}

  await loadInjectables();

  const instance = Injector.resolve<TestService>('injectable', 'TestService');
  assert.instance(instance, TestService);
});

test('@Inject should inject an instance of the decorated class', async () => {
  @Injectable()
  class TestService {
    testMethod(): string {
      return 'value';
    }
  }

  class TestClass {
    @Inject('TestService')
    testService: TestService;
  }

  await loadInjectables();

  const subject = new TestClass();

  assert.instance(subject.testService, TestService);
  assert.is(subject.testService.testMethod(), 'value');
});

test('@Inject should inject a custom provider', async () => {
  @Injectable({ interface: NATIVE_SERVICES.HTTP_SERVICE })
  class TestService implements HttpClient<unknown> {
    request(options: unknown): string {
      return 'custom service';
    }
  }

  class TestClass {
    @Inject(NATIVE_SERVICES.HTTP_SERVICE)
    testService: HttpClient;
  }

  await loadInjectables();

  const subject = new TestClass();

  assert.instance(subject.testService, TestService);
  assert.instance(Injector.resolve('injectable', NATIVE_SERVICES.HTTP_SERVICE), TestService);
  assert.is(subject.testService.request(undefined), 'custom service');
});

test.run();
