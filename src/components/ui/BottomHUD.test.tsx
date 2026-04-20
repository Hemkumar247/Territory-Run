import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomHUD } from './BottomHUD';
import { describe, it, expect, vitest } from 'vitest';

describe('BottomHUD Component', () => {
  it('renders start button when not running or paused', () => {
    render(
      <BottomHUD 
        isRunning={false} 
        isPaused={false} 
        distance="0.0" 
        pace="0'00" 
        time="00:00"
        onStart={() => {}} onPause={() => {}} onResume={() => {}} onStop={() => {}} 
      />
    );
    expect(screen.getByRole('button', { name: /start run/i })).toBeInTheDocument();
  });

  it('renders pause and stop buttons when running', () => {
    render(
      <BottomHUD 
        isRunning={true} 
        isPaused={false} 
        distance="1.0" 
        pace="5'00" 
        time="05:00"
        onStart={() => {}} onPause={() => {}} onResume={() => {}} onStop={() => {}} 
      />
    );
    expect(screen.getByRole('button', { name: /pause run/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop run/i })).toBeInTheDocument();
  });

  it('calls onResume when resume is clicked', () => {
    const handleResume = vitest.fn();
    render(
      <BottomHUD 
        isRunning={false} 
        isPaused={true} 
        distance="1.0" 
        pace="5'00" 
        time="05:00"
        onStart={() => {}} onPause={() => {}} onResume={handleResume} onStop={() => {}} 
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /resume run/i }));
    expect(handleResume).toHaveBeenCalled();
  });
});
