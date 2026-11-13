import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LifeAIWorkspace from '../components/admin/LifeAIWorkspace';

test('Life AI chat server markup does not vary with server timezone', () => {
  const originalTimezone = process.env.TZ;
  try {
    process.env.TZ = 'UTC';
    const utcMarkup = renderToStaticMarkup(createElement(LifeAIWorkspace));

    process.env.TZ = 'America/Los_Angeles';
    const localMarkup = renderToStaticMarkup(createElement(LifeAIWorkspace));

    assert.equal(localMarkup, utcMarkup);
    assert.match(utcMarkup, /Welcome back, Bereda\./);
    assert.doesNotMatch(utcMarkup, /Good (morning|afternoon|evening), Bereda\./);
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
