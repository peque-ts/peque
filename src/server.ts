import $RefParser from '@apidevtools/json-schema-ref-parser';
import express, { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { Inject } from './decorators/injectable';
import { ExpressFactory } from './factory/express-factory';
import { SwaggerFactory } from './factory/swagger-factory';
import { fallback } from './middlewares/_index';
import { pushHttpEvents } from './middlewares/_index';
import { errorHandler, logError } from './middlewares/error-handler.middleware';
import { ServerOptions } from './models/_index';
import { Controllers } from './models/dependency-injection/controller.service';
import { Modules } from './models/dependency-injection/module.service';
import { LifeCycleService } from './services/life-cycle/life-cycle.service';
import { LoggerService } from './services/logger/logger.service';
import { destroyInjectables, loadInjectables } from './utils/dependencies.utils';
import { getPath } from './utils/fs.utils';
import { guardExecutor } from './middlewares/guard.middleware';
import { Injector } from './models/dependency-injection/injector.service';
import { CanExecute } from './models/interfaces/authorization.interface';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';

export interface GlobalMiddlewares {
  preRoutes?: any[];
  postRoutes?: any[];
}

export class Server {
  @Inject('LoggerService')
  private logService: LoggerService;

  constructor(private options: ServerOptions) {
    this.setDefaultUnhandledExceptionsFallback();
  }

  logger() {
    return this.logService;
  }

  async terminator() {
    await Server.destroyControllers();
    await Server.destroyModules();
    await Server.destroyInjectables();

    await Server.serverListenStop();
    await ExpressFactory.closeServer();

    await Server.serverShutdown();
    process.exit(1);
  }

  terminationProcess() {
    const terminationSignals = ['SIGINT', 'SIGTERM', 'SIGBREAK', 'SIGHUP'];
    terminationSignals.forEach((element) => {
      process.on(element, async () => {
        await this.terminator();
      });
    });
  }

  async bootstrap(): Promise<Application> {
    // Set terminators.
    this.terminationProcess();

    // Load injectables and controllers.
    await Server.loadInjectables();
    await Server.loadModules();

    // Load existing app or one from scratch.
    this.options.existingApp = this.options.existingApp ? this.options.existingApp : express();

    // Session.
    if (this.options.session) {
      this.options.existingApp.use(expressSession(this.options.session));
    }

    // Cookie parser.
    this.options.existingApp.use(cookieParser());

    // Global guards.
    const guards = this.options.guards?.map((guard) => guardExecutor(Injector.resolve<CanExecute>(guard.name))) || [];
    this.options.existingApp.use(...guards);

    // Push HTTP event.
    this.options.existingApp.use(pushHttpEvents);

    // Add pre-route Middlewares.
    this.addMiddlewares(this.options.globalMiddlewares.preRoutes);

    this.options.existingApp = await this.loadControllers();

    // OpenAPI.
    if (this.options.swagger) {
      const swaggerFactory = new SwaggerFactory();
      swaggerFactory.generate();
      const swaggerDocument = await $RefParser.dereference(
        YAML.parse(getPath('../swagger/generated/base-swagger-doc.yaml')),
      );
      this.options.existingApp.use(this.options.swagger.folder, swaggerUi.serve, swaggerUi.setup(swaggerDocument));
      this.logService.log({ level: 'info', data: `[openapi] ${this.options.swagger.folder}` });
    }

    // Add fallback.
    this.options.existingApp.use(fallback);

    // Add post-route Middlewares.
    this.addMiddlewares([...this.options.globalMiddlewares.postRoutes, logError, errorHandler]);

    return this.options.existingApp;
  }

  private async loadControllers() {
    return await Controllers.initControllers(this.options);
  }

  private static async destroyControllers() {
    await Controllers.destroyControllers();
  }

  private static async loadModules() {
    await Modules.initModules();
  }

  private static async destroyModules() {
    await Modules.destroyModules();
  }

  private static async loadInjectables() {
    await loadInjectables();
  }

  private static async destroyInjectables() {
    await destroyInjectables();
  }

  private static async serverShutdown() {
    await LifeCycleService.triggerServerShutdown();
  }

  private static async serverListenStop() {
    await LifeCycleService.triggerServerListenStop();
  }

  private addMiddlewares(middlewares: any[]) {
    middlewares.forEach((middleware) => {
      this.options.existingApp.use(middleware);
    });
  }

  private setDefaultUnhandledExceptionsFallback() {
    process.on('uncaughtException', async (error) => await LifeCycleService.triggerUncaughtException(error));
    process.on('unhandledRejection', async (error) => await LifeCycleService.triggerUncaughtRejection(error));
  }
}
