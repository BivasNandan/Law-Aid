import { buildDriver } from './setup.js';
import assert from 'assert';

describe('Home page smoke test', function () {
  this.timeout(30000);

  let driver;
  const BASE = process.env.FRONTEND_URL || 'http://localhost:5173';

  before(async () => {
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('loads frontend and has a non-empty title', async () => {
    await driver.get(BASE);
    await driver.sleep(800);
    const title = await driver.getTitle();
    assert.ok(title && title.length > 0, 'Page title should exist');
  });
});
