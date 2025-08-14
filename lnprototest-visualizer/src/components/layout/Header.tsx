import React from 'react';
import { Header as CloudscapeHeader, Button, SpaceBetween } from '@cloudscape-design/components';

const Header: React.FC = () => {
  // Minimal dark mode toggle (adds/removes 'dark' class and sets Cloudscape color mode)
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    // Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-awsui-color-mode', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-awsui-color-mode', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <CloudscapeHeader
      variant="h1"
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          {/* <Button
            variant="normal"
            onClick={() => setIsDark(d => !d)}
          >
            {isDark ? 'Light mode' : 'Dark mode'}
          </Button> */}
        </SpaceBetween>
      }
    >
    </CloudscapeHeader>
  );
};

export default Header