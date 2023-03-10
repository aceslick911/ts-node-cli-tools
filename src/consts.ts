import type { Terminal } from 'terminal-kit';

export type ConstTypes = typeof CONST;

export const VendorSpecificValues = {
  buildNumber: 1,
  JIRAProjectKey: 'BEMA',

  bitrisePaths:{
    master_ios: 'https://app.bitrise.io/app/81042ace2ccfc0ff',
    master_android: 'https://app.bitrise.io/app/d3d4490a44d503a4',
  },

  mobileWebSubPaths :[
    '/exchange/',

    //'custom', // Not implemented but you can run the command with --root-folder=<anything>

    '/',
    '/nmo/',
    // Phonetic alphabet generic environments
    '/nmo/prototype/zulu/',
    '/nmo/prototype/yankee/',
    '/nmo/prototype/xray/',
    '/nmo/prototype/whiskey/',
    '/nmo/prototype/victor/',
  ],

  mobileWebDeployFileList:[
    '.well-known',
    'apple-app-site-association',
    'apple-touch-icon.png',
    'favicon.ico',
    'asset-manifest.json',
    'fonts',
    'index.html',
    'manifest.json',
    'serve.json',
    'static',
  ],

  appConfigFiles:[
    'index.prod.web.ts',
    'index.prod.ts',
    'index.staging.ts',
    'index.dev.ts',
  ]
} as const;

export const CONST = {
  ci: false,
  terminalWidth: 90 as const,
  VERBOSE: true,
  platforms: ['web', 'ios', 'android'] as const,
  environments: ['prod', 'staging', 'dev', 'branch'] as const,

  paths: VendorSpecificValues.mobileWebSubPaths,

  bema: {
    webArtifactName: 'mobile-web-build.zip',
    // Used to know what artifacts to look out for when creating web bundles

    buildArtifacts: {
      files:VendorSpecificValues.mobileWebDeployFileList,
    },
    knownPaths: {
      configFiles: 'App/Config',
    },
    knownConfigFiles: VendorSpecificValues.appConfigFiles,
  } as const,
};

export const tables: { [template: string]: Terminal.TextTableOptions } = {
  error: {
    hasBorder: true,
    contentHasMarkup: true,
    fit: true,

    firstCellTextAttr: { bgColor: 'red' },
    borderAttr: { color: 'white' },
    borderChars: 'lightRounded',
    textAttr: { bgColor: 'default' },
    firstRowTextAttr: { bgColor: 'red' },
    width: CONST.terminalWidth,
  },
  outputDisplay: {
    hasBorder: true,
    contentHasMarkup: 'ansi',
    fit: true,

    borderAttr: { color: 'lime' },
    borderChars: 'lightRounded',
    firstCellTextAttr: { bgColor: 'default' },
    firstRowTextAttr: { bgColor: 'blue' },

    textAttr: { bgColor: 'default' },
    width: CONST.terminalWidth,
  },
  cropDisplay: {
    hasBorder: true,
    contentHasMarkup: 'ansi',
    fit: true,
    wordWrap: false,

    borderAttr: { color: 'green' },
    borderChars: 'lightRounded',
    firstCellTextAttr: { bgColor: 'default' },
    firstRowTextAttr: { bgColor: 'blue' },

    textAttr: { bgColor: 'default' },
    width: CONST.terminalWidth,
  },
} as const;

export type ValueOf<T> = T[keyof T];
export type ValueIn<T> = T extends Readonly<Array<infer U>> ? U : never;
