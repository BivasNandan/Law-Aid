import { buildDriver } from './setup.js';
import { By, until } from 'selenium-webdriver';
import assert from 'assert';

describe('Login flow', function () {
  this.timeout(60000);

  let driver;
  const BASE = process.env.FRONTEND_URL || 'http://localhost:5173';
  const LOGIN_PATH = process.env.LOGIN_PATH || '/login';
  const EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
  const PASS = process.env.TEST_USER_PASSWORD || 'password';

  before(async () => {
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('logs in with test credentials (adjust env vars if needed)', async () => {
    await driver.get(`${BASE}${LOGIN_PATH}`);

    await driver.wait(
      until.elementLocated(By.css('input[name="email"], input[type="email"], input#email')),
      10000
    );

    const emailEl = await driver.findElement(By.css('input[name="email"], input[type="email"], input#email'));
    const passEl = await driver.findElement(By.css('input[name="password"], input[type="password"], input#password'));
    const submit = await driver.findElement(
      By.css('button[type="submit"], button[id="loginBtn"], button[name="login"]')
    );

    await emailEl.clear();
    await emailEl.sendKeys(EMAIL);
    await passEl.clear();
    await passEl.sendKeys(PASS);
    await submit.click();

    // Wait for either URL change OR presence of a logged-in indicator
    const startUrl = await driver.getCurrentUrl();
    const loggedInSelectors = [
      'button#logout',
      'a[href="/logout"]',
      'button.logout',
      '.Navbar',
      '.navbar',
      '.Header',
      'a[href="/profile"]',
      'a[href="/user"]',
    ];

    const success = await driver
      .wait(async () => {
        const cur = await driver.getCurrentUrl();
        if (cur !== startUrl) return true;

        for (const sel of loggedInSelectors) {
          const els = await driver.findElements(By.css(sel));
          if (els.length > 0) return true;
        }

        // also check for explicit login failure
        const errEls = await driver.findElements(By.css('.error, .alert-danger, .login-error'));
        if (errEls.length > 0) return false;

        return false;
      }, 15000)
      .catch(() => false);

    if (!success) {
      const cur = await driver.getCurrentUrl();
      let errText = '';
      try {
        const errEl = await driver.findElement(By.css('.error, .alert-danger, .login-error'));
        errText = await errEl.getText();
      } catch (e) {
        // ignore missing error elements
      }

      assert.fail(`Login did not appear successful. Current URL: ${cur}. Error text: ${errText}`);
    }

    const finalUrl = await driver.getCurrentUrl();
    assert.notStrictEqual(finalUrl.endsWith(LOGIN_PATH), true, 'Should navigate away from login on success');
  });
});
