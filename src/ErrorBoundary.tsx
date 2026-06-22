import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="my-8 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-500">
          Something went wrong rendering this content.
        </div>
      );
    }
    return this.props.children;
  }
}
