import React from 'react';
import { DiagramNode } from './shared/DiagramNode';
import { DiagramArrow } from './shared/DiagramArrow';
import { DiagramWrapper } from './shared/DiagramWrapper';
import { ICONS } from './shared/icons';

function ArtifactRegistryNode() {
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-xl border-2 shadow-sm px-4 py-3 transition-shadow hover:shadow-md"
      style={{ backgroundColor: '#E8F0FE', borderColor: '#1a73e8' }}
    >
      <img src={ICONS.artifactRegistry} alt="" aria-hidden className="w-6 h-6 object-contain" loading="lazy" />
      <span className="text-sm font-semibold font-sans text-center leading-snug" style={{ color: '#1a5da8' }}>
        Artifact Registry
      </span>
    </div>
  );
}

export function WifDirectAccess() {
  return (
    <DiagramWrapper title="Direct Resource Access — no service account" icon={ICONS.gcp}>
      <div className="flex flex-col items-center gap-3 py-4">
        <DiagramNode
          icon={ICONS.github}
          theme="github"
          label="Federated Identity"
          tooltip="Represented as a principalSet URI derived from the token's attributes (repo, branch, org). GCP evaluates IAM bindings against these attributes at access time."
        />

        <DiagramArrow
          direction="down"
          label="roles/artifactregistry.writer (bound directly on the registry)"
          color="#1a73e8"
        />

        <ArtifactRegistryNode />
      </div>

      <p className="text-[11px] text-stone-400 font-sans text-center mt-2">
        ABAC-style — the federated identity holds the IAM role directly on the resource.
      </p>
    </DiagramWrapper>
  );
}
