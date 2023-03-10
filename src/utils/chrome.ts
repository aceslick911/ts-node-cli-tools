import * as puppeteer from 'puppeteer';
import { runAsyncCommandManaged } from './exec.js';
import { resolveHomePath } from './utils.js';
import { logger } from './logger.js';
import { text } from './text.js';

export const launchBrowser = (url: string) =>
  new Promise<string>((resolve, reject) => {
    const child = runAsyncCommandManaged({
      command: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      args: [
        `--user-data-dir=${resolveHomePath}/Library/Application Support/Google/Chrome/`,
        '--no-first-run',
        `--remote-debugging-port=9222`,
      ],
      onErr: data => {
        const wsString = `DevTools listening on `;
        if (data.includes(wsString)) {
          logger.log(text.strong(data));
          const wsUrl = data.split(wsString)[1].trim();
          resolve(wsUrl);
        } else {
          logger.warn(data);
        }
      },
    })
      .then(output => {
        logger.log('child', child);
      })
      .catch(err => {
        logger.error(err);
        reject(err);
      });
  });

export const controlBrowser = async (wsUrl: string, url: string) => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
  });

  logger.log('connected');

  try {
    return await browser
      .newPage()
      .then(async page => {
        logger.log('Goto');
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        logger.log('goto done');
        return page;
      })
      .then(page => ({
        clickElement: async (props: {
          xpath: string;
          selector?: string;
          id?: string;
        }) => {
          logger.log(`👉🏻  Clicking element ${props.xpath}`);
          const elem = (await page.$x(props.xpath))[0];
          if (!elem) {
            throw new Error(`button not found: ${props.xpath}`);
          }
          await elem.click();
        },
        setTextbox: async (props: {
          xpath: string;
          selector?: string;
          id?: string;
          value: string;
        }) => {
          logger.log(`🔲 Setting textbox to:${props.value} (${props.xpath})`);

          const input = (await page.$x(props.xpath))[0];
          await input.click({ clickCount: 3 });
          await page.keyboard.press('Backspace');

          const textbox = (await page.$x(props.xpath))[0];
          await textbox.type(props.value);
        },

        selectDropdown: async (props: { valueSelector: string }) => {
          logger.log(`🔘 Selecting dropdown to ${props.valueSelector}`);

          await page.$eval(
            props.valueSelector,
            (e, no) => e.setAttribute('selected', no),
            true,
          );
        },
      }));
  } catch (e) {
    logger.error(e);
    throw e;
  }
};
