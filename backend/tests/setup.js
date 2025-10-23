import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import 'chromedriver';

export function buildDriver() {
  const options = new chrome.Options();

  if (process.env.HEADLESS !== 'false') {
    options.addArguments('--headless=new');
  }

  options.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu');
  options.windowSize({ width: 1280, height: 900 });

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
}
