import React from 'react';

export const DIAGRAMS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'wif-pool-provider-setup':        React.lazy(() => import('./WifPoolProviderSetup').then(m => ({ default: m.WifPoolProviderSetup }))),
  'wif-token-exchange':             React.lazy(() => import('./WifTokenExchange').then(m => ({ default: m.WifTokenExchange }))),
  'wif-direct-access':              React.lazy(() => import('./WifDirectAccess').then(m => ({ default: m.WifDirectAccess }))),
  'wif-sa-setup':                   React.lazy(() => import('./WifServiceAccountSetup').then(m => ({ default: m.WifServiceAccountSetup }))),
  'wif-sa-token-flow':              React.lazy(() => import('./WifServiceAccountTokenFlow').then(m => ({ default: m.WifServiceAccountTokenFlow }))),
  'wif-full-flow':                  React.lazy(() => import('./WifFullFlow').then(m => ({ default: m.WifFullFlow }))),
};
