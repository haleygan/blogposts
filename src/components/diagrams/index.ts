import React from 'react';

export const DIAGRAMS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'wif-pool-provider-setup':        React.lazy(() => import('./WifPoolProviderSetup').then(m => ({ default: m.WifPoolProviderSetup }))),
  'wif-token-exchange':             React.lazy(() => import('./WifTokenExchange').then(m => ({ default: m.WifTokenExchange }))),
  'wif-direct-access':              React.lazy(() => import('./WifDirectAccess').then(m => ({ default: m.WifDirectAccess }))),
  'wif-sa-setup':                   React.lazy(() => import('./WifServiceAccountSetup').then(m => ({ default: m.WifServiceAccountSetup }))),
  'wif-sa-token-flow':              React.lazy(() => import('./WifServiceAccountTokenFlow').then(m => ({ default: m.WifServiceAccountTokenFlow }))),
  'wif-full-flow':                  React.lazy(() => import('./WifFullFlow').then(m => ({ default: m.WifFullFlow }))),
  'top-level-shape':                React.lazy(() => import('./TopLevelShape').then(m => ({ default: m.TopLevelShape }))),
  'library-of-books':               React.lazy(() => import('./LibraryOfBooks').then(m => ({ default: m.LibraryOfBooks }))),
  'how-you-enter-the-system':       React.lazy(() => import('./HowYouEnterTheSystem').then(m => ({ default: m.HowYouEnterTheSystem }))),
  'deliberate-upkeep':              React.lazy(() => import('./DeliberateUpkeep').then(m => ({ default: m.DeliberateUpkeep }))),
  'weekly-linting-schedule':        React.lazy(() => import('./WeeklyLintingSchedule').then(m => ({ default: m.WeeklyLintingSchedule }))),
  'inbox-loop':                     React.lazy(() => import('./InboxLoop').then(m => ({ default: m.InboxLoop }))),
};
