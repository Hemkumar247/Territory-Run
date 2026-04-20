import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { GlassCard } from './GlassCard';

describe('GlassCard component', () => {
  it('renders correctly with base variant', () => {
    render(<GlassCard>Content Base</GlassCard>);
    const el = screen.getByText('Content Base');
    expect(el.className).toContain('glass-card-base');
  });

  it('renders correctly with neon variant and glow details', () => {
    render(<GlassCard variant="neon" glow={true} glowColor="#FF00FF">Neon Glow</GlassCard>);
    const el = screen.getByText('Neon Glow');
    expect(el.className).toContain('glass-card-neon');
    const bgMatch = el.style.backgroundColor.includes('rgba(255, 0, 255, 0.078)') || el.style.backgroundColor.includes('rgba(255, 0, 255, 0.08)');
    expect(bgMatch).toBe(true);
  });

  it('renders correctly without glow despite glowColor set', () => {
    render(<GlassCard glow={false} glowColor="#FF00FF">No Glow</GlassCard>);
    const el = screen.getByText('No Glow');
    expect(el.style.backgroundColor).not.toBe('rgba(255, 0, 255, 0.078)');
  });
});
