import type { ReactNode } from 'react';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, children, action }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
      <div>
        {title && <h1 style={{ fontSize: 28 }}>{title}</h1>}
        {subtitle && <p style={{ color: 'var(--muted)' }}>{subtitle}</p>}
        {children}
      </div>
      {action}
    </div>
  );
}
