import React from 'react';
import { render, screen } from '@testing-library/react';
import { NavigationTabBar } from './NavigationTabBar';
import { describe, it, expect, vitest } from 'vitest';

describe('NavigationTabBar Accessibility', () => {
  it('uses semantic nav and tablist roles', () => {
    const handleTabChange = vitest.fn();
    render(
      <NavigationTabBar activeTab="map" onTabChange={handleTabChange} />
    );
    
    // Check for the existence of the nav landmark
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    
    // Check for the tab list
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    
    // Check that there are tabs
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThan(0);
    
    // Check aria-selected
    expect(screen.getByRole('tab', { name: /go to map/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /go to profile/i })).toHaveAttribute('aria-selected', 'false');
  });
});
