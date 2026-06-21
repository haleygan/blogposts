import React from 'react';
import { WifPoolProviderSetup } from './WifPoolProviderSetup';
import { WifTokenExchange } from './WifTokenExchange';
import { WifDirectAccess } from './WifDirectAccess';
import { WifServiceAccountSetup } from './WifServiceAccountSetup';
import { WifServiceAccountTokenFlow } from './WifServiceAccountTokenFlow';
import { WifFullFlow } from './WifFullFlow';

export const DIAGRAM_REGISTRY: Record<string, React.ComponentType> = {
  'wif-pool-provider-setup': WifPoolProviderSetup,
  'wif-token-exchange':      WifTokenExchange,
  'wif-direct-access':       WifDirectAccess,
  'wif-sa-setup':            WifServiceAccountSetup,
  'wif-sa-token-flow':       WifServiceAccountTokenFlow,
  'wif-full-flow':           WifFullFlow,
};
