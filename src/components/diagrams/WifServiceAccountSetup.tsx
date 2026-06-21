import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramArrow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';
import { ICONS } from './shared/icons';

export function WifServiceAccountSetup() {
  return (
    <DiagramWrapper title="SA Impersonation Setup — one IAM binding" icon={ICONS.gcp}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
        <DiagramNode
          icon={ICONS.github}
          theme="github"
          label="Federated Identity"
          tooltip="Scoped to specific token attributes (e.g. attribute.repository == my-org/my-repo). Only workflows matching this attribute can impersonate the service account."
        />

        <DiagramArrow
          direction="right"
          label="roles/iam.workloadIdentityUser"
          color="#BA7517"
        />

        <DiagramNode
          icon={ICONS.gcp}
          theme="sa"
          label="Service Account"
          tooltip="The Workload Identity User role grants the right to impersonate this SA. It doesn't grant GCP resource access on its own — that comes from the SA's own IAM roles."
        />
      </div>

      <p className="text-[11px] text-stone-400 font-sans text-center mt-2">
        RBAC-style — the SA holds resource permissions, the federated identity is granted the right to assume it.
      </p>
    </DiagramWrapper>
  );
}
