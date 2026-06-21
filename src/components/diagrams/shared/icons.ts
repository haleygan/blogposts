export const ICONS = {
  github: 'https://api.iconify.design/logos:github-icon.svg',
  gcp:    'https://api.iconify.design/logos:google-cloud.svg',
};

// Inline SVG — avoids CDN availability issues for specific GCP services
import React from 'react';

export function GcsBucketIcon({ size = 24 }: { size?: number }) {
  return React.createElement('svg', {
    width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, fill: 'none',
  },
    React.createElement('ellipse', { cx: 12, cy: 6, rx: 8, ry: 2.5, fill: '#1a73e8' }),
    React.createElement('path', {
      d: 'M4 6v12c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V6c-1.78 1.15-4.67 1.8-8 1.8S5.78 7.15 4 6z',
      fill: '#1a73e8', opacity: 0.75,
    }),
  );
}
