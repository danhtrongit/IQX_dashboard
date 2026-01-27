'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Custom Toaster component optimized for IQX-Pro Dashboard
 * - Position: top-right for desktop, top-center for mobile
 * - Glassmorphism styling
 * - Smooth animations
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-right"
      gap={8}
      offset={16}
      visibleToasts={4}
      closeButton={false}
      richColors={false}
      expand={false}
      toastOptions={{
        className: 'toast-item',
        style: {
          // Reset default sonner styles for custom toast
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: 0,
        },
      }}
      style={{
        // Custom positioning
        '--offset': '16px',
      } as React.CSSProperties}
      {...props}
    />
  );
};

export { Toaster };
