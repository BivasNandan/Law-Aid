import { buildDriver } from './setup.js';
import { By, until } from 'selenium-webdriver';
import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Client Details - profile upload', function () {
  this.timeout(60000);

  let driver;
  const BASE = process.env.FRONTEND_URL || 'http://localhost:5173';
  const CLIENT_PATH = process.env.CLIENT_DETAILS_PATH || '/client-details';

  before(async () => {
    driver = await buildDriver();
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('uploads profile image and shows preview (input id="profilePicInput")', async () => {
    await driver.get(`${BASE}${CLIENT_PATH}`);

    const fileInput = await driver.wait(
      until.elementLocated(By.css('#profilePicInput, input[type="file"]')),
      10000
    );

    // resolve absolute file path to test image
    const filePath = path.resolve(__dirname, 'fixtures', 'test-avatar.jpg');
    await fileInput.sendKeys(filePath);

    await driver.sleep(800);

    const imgs = await driver.findElements(By.css('img[alt="preview"], img.preview'));
    assert.ok(imgs.length > 0, 'Preview image should appear after selecting a file');
  });
});
