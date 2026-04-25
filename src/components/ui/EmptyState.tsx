import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      <div className="text-5xl mb-4" role="img" aria-label={title}>{icon}</div>
      <h3 className="text-lg font-semibold text-charcoal mb-2 font-heading">{title}</h3>
      <p className="text-sm text-charcoal/60 max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link 
            href={action.href} 
            className="inline-flex items-center justify-center rounded-full bg-teal px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-teal/90"
          >
            {action.label}
          </Link>
        ) : (
          <button 
            onClick={action.onClick} 
            className="inline-flex items-center justify-center rounded-full bg-teal px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-teal/90"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
