import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramWrapper } from './shared/DiagramWrapper';
import { ICONS } from './shared/icons';

export function WifPoolProviderSetup() {
  return (
    <DiagramWrapper title="Pool &amp; Provider Structure" icon={ICONS.gcp}>
      <div className="rounded-xl border-2 p-5" style={{ backgroundColor: '#E1F5EE', borderColor: '#0F6E56' }}>
        <div className="flex items-center gap-2 mb-4">
          <img src={ICONS.gcp} alt="" aria-hidden className="w-5 h-5" loading="lazy" />
          <span className="text-sm font-bold font-sans" style={{ color: '#0F6E56' }}>Workload Identity Pool</span>
        </div>

        <div className="rounded-lg border-2 p-4" style={{ backgroundColor: '#EEEDFE', borderColor: '#534AB7' }}>
          <div className="flex items-center gap-2 mb-4">
            <img src={ICONS.github} alt="" aria-hidden className="w-5 h-5" loading="lazy" />
            <span className="text-sm font-bold font-sans" style={{ color: '#534AB7' }}>Provider: GitHub Actions</span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <DiagramNode
              theme="provider"
              label="Issuer URL"
              tooltip="GCP fetches GitHub's public keys from this URL to verify that incoming tokens were genuinely signed by GitHub."
            />
            <DiagramNode
              theme="provider"
              label="Attribute Mapping"
              tooltip="Translates JWT claims into GCP attributes. e.g. google.subject = assertion.sub. Lets you reference GitHub fields in IAM conditions."
            />
            <DiagramNode
              theme="provider"
              label="Attribute Condition"
              tooltip='Guards which tokens are accepted. e.g. attribute.repository_owner == "my-org". Without this, any GitHub workflow could authenticate to your project.'
            />
          </div>

          <p className="text-[10px] text-stone-400 font-sans text-center mt-3">tap or hover each rule for detail</p>
        </div>
      </div>
    </DiagramWrapper>
  );
}
