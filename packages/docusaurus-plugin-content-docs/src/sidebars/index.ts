/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs-extra';
import importFresh from 'import-fresh';
import type {SidebarsConfig, Sidebars, NormalizedSidebars} from './types';
import type {NormalizeSidebarsParams, PluginOptions} from '../types';
import {validateSidebars} from './validation';
import {normalizeSidebars} from './normalization';
import {processSidebars, type SidebarProcessorParams} from './processor';
import path from 'path';
import {createSlugger} from '@docusaurus/utils';

export const DefaultSidebars: SidebarsConfig = {
  defaultSidebar: [
    {
      type: 'autogenerated',
      dirName: '.',
    },
  ],
};

export const DisabledSidebars: SidebarsConfig = {};

// If a path is provided, make it absolute
// use this before loadSidebars()
export function resolveSidebarPathOption(
  siteDir: string,
  sidebarPathOption: PluginOptions['sidebarPath'],
): PluginOptions['sidebarPath'] {
  return sidebarPathOption
    ? path.resolve(siteDir, sidebarPathOption)
    : sidebarPathOption;
}

function loadSidebarsFileUnsafe(
  sidebarFilePath: string | false | undefined,
): SidebarsConfig {
  // false => no sidebars
  if (sidebarFilePath === false) {
    return DisabledSidebars;
  }

  // undefined => defaults to autogenerated sidebars
  if (typeof sidebarFilePath === 'undefined') {
    return DefaultSidebars;
  }

  // Non-existent sidebars file: no sidebars
  // Note: this edge case can happen on versioned docs, not current version
  // We avoid creating empty versioned sidebars file with the CLI
  if (!fs.existsSync(sidebarFilePath)) {
    return DisabledSidebars;
  }

  // We don't want sidebars to be cached because of hot reloading.
  return importFresh(sidebarFilePath);
}

export function loadSidebarsFile(
  sidebarFilePath: string | false | undefined,
): SidebarsConfig {
  const sidebarsConfig = loadSidebarsFileUnsafe(sidebarFilePath);
  validateSidebars(sidebarsConfig);
  return sidebarsConfig;
}

export function loadNormalizedSidebars(
  sidebarFilePath: string | false | undefined,
  params: NormalizeSidebarsParams,
): NormalizedSidebars {
  return normalizeSidebars(loadSidebarsFile(sidebarFilePath), params);
}

// Note: sidebarFilePath must be absolute, use resolveSidebarPathOption
export async function loadSidebars(
  sidebarFilePath: string | false | undefined,
  options: SidebarProcessorParams,
): Promise<Sidebars> {
  const normalizeSidebarsParams: NormalizeSidebarsParams = {
    ...options.sidebarOptions,
    version: options.version,
    categoryLabelSlugger: createSlugger(),
  };
  const normalizedSidebars = loadNormalizedSidebars(
    sidebarFilePath,
    normalizeSidebarsParams,
  );
  return processSidebars(normalizedSidebars, options);
}
