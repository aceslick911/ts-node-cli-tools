import { VendorSpecificValues } from '../consts.js';
import { controlBrowser, launchBrowser } from '../utils/chrome.js';
import { logger } from '../utils/logger.js';
import { delay } from '../utils/utils.js';

export const bitriseConfig = {
  urls: {
    ...VendorSpecificValues.bitrisePaths
  },

  waitTime: 2000,

  elements: {
    scheduleBuildButton: `/html/body/div[2]/div[1]/div[1]/div/r-app-details-header/div/div/div[2]/div/button`,
    branchTextbox: `/html/body/div[2]/div[2]/div/article/div/section[2]/section[2]/input`,
    messageTextbox: `//*[@id="popup-build-config"]/div/article/div/section[2]/section[3]/textarea`,
    pipelineDropdown: `#popup-build-config > div > article > div > section:nth-child(2) > section:nth-child(4) > select`,
    startBuildButton: `//*[@id="popup-build-config"]/div/footer/button[1]`,
  },

  pipelineTargets: {
    ios: {
      rn68Primary: `#popup-build-config > div > article > div > section:nth-child(2) > section:nth-child(4) > select > optgroup > option:nth-child(4)`,
    },
  },
};

export const Actions = {
  launchBrowser: (url: string) =>
    logger.indented(
      `🌎 launchBrowser`,
      () =>
        new Promise(_resolve => {
          //TODO: resolve must be called to exit

          logger.info(`launching chrome...`);
          return launchBrowser(url).then(wsUrl => {
            logger.info(`ok got : wsUrl: ${wsUrl}`);

            return Actions.buildIosMaster(wsUrl);
          });

          // return resolve(true);
        }),
    ),
  buildIosMaster: (
    wsUrl: string = bitriseConfig.urls.master_ios,
    branchName = 'develop',
    buildMessage = 'cli build',
    pipeline = 'rn68Primary' as keyof typeof bitriseConfig.pipelineTargets.ios,
  ) =>
    logger.indented(`📲 build ios master`, () => {
      return controlBrowser(wsUrl, bitriseConfig.urls.master_ios).then(
        async page => {
          await delay(bitriseConfig.waitTime);

          await page.clickElement({
            xpath: bitriseConfig.elements.scheduleBuildButton,
          });
          await page.setTextbox({
            xpath: bitriseConfig.elements.branchTextbox,
            value: branchName,
          });
          await page.setTextbox({
            xpath: bitriseConfig.elements.messageTextbox,
            value: buildMessage,
          });

          await delay(bitriseConfig.waitTime);

          await page.selectDropdown({
            valueSelector: bitriseConfig.pipelineTargets.ios[pipeline],
          });

          await delay(bitriseConfig.waitTime);

          await page.clickElement({
            xpath: bitriseConfig.elements.startBuildButton,
          });

          return true;
        },
      );
    }),
};
