import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatsDisplay } from './StatsDisplay';

describe('StatsDisplay component', () => {
  it('renders default StatsDisplay with NeonText implicitly', () => {
    render(<StatsDisplay label="Speed" value={15} unit="km/h" color="#FF0000" />);
    // Since colorClass is unspecified, it defaults to NeonText fallback
    expect(screen.getByText('Speed')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('km/h')).toBeDefined();
  });

  it('renders colorClass fallback instead of NeonText', () => {
    render(<StatsDisplay label="Points" value={100} colorClass="text-red-500" />);
    const valueEl = screen.getByText('100');
    expect(valueEl.className).toContain('text-red-500');
  });

  it('renders without unit accurately', () => {
    render(<StatsDisplay label="Count" value={5} />);
    expect(screen.queryByText('km/h')).toBeNull();
  });
});
