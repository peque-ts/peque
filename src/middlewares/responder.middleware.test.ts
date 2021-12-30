import { suite } from 'uvu';
import * as assert from 'uvu/assert';

import { ExpressMocks } from '../../test/mocks/express.mocks';
import { HTTP_STATES } from '../models/constants/http-states';
import { responder } from './responder.middleware';

const test = suite('Responder Middleware');

const expressMocks = new ExpressMocks();

test('should respond to the client correctly with set statusCode', () => {
  const body = { statusCode: HTTP_STATES.HTTP_200 };

  const res = expressMocks.mockResponse({}, { data: body });
  const req = expressMocks.mockRequest();
  const next = expressMocks.mockNextFunction();

  responder(req, res, next);

  assert.ok(expressMocks.spy('setHeader').calledWith('Content-Type', 'application/json'));
  assert.ok(expressMocks.spy('status').calledWith(HTTP_STATES.HTTP_200));
  assert.ok(expressMocks.spy('send').calledWith(body));
  assert.is(expressMocks.spy('end').callCount, 1);
});

test('should respond to the client correctly without set statusCode', () => {
  const res = expressMocks.mockResponse();
  const req = expressMocks.mockRequest();
  const next = expressMocks.mockNextFunction();

  responder(req, res, next);

  assert.ok(expressMocks.spy('setHeader').calledWith('Content-Type', 'application/json'));
  assert.ok(expressMocks.spy('status').calledWith(HTTP_STATES.HTTP_200));
  assert.ok(expressMocks.spy('send').calledWith({}));
  assert.is(expressMocks.spy('end').callCount, 1);
});

test.run();
