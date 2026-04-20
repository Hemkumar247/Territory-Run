import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { NeonText } from './NeonText';

describe('NeonText', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<NeonText>Cyber Glow</NeonText>);
    const textElement = getByText('Cyber Glow');
    expect(textElement.className).toContain('font-display');
  });

  it('renders correctly with customized intensity and no glow', () => {
    const { getByText } = render(
      <NeonText intensity="low" glow={false} color="#FFFFFF">Low Glow</NeonText>
    );
    const textElement = getByText('Low Glow');
    expect(textElement.style.color).toBe('rgb(255, 255, 255)');
    expect(textElement.style.textShadow).toBe('');
  });

  it('renders correctly with no glow and currentColor', () => {
    const { getByText } = render(
      <NeonText glow={false} color="currentColor">No Glow Current</NeonText>
    );
    const textElement = getByText('No Glow Current');
    expect(textElement.style.color).toBe('');
  });

  it('renders correctly with high intensity glow and currentColor', () => {
    const { getByText } = render(
      <NeonText intensity="high" glow={true} color="currentColor">High Glow</NeonText>
    );
    const textElement = getByText('High Glow');
    expect(textElement.style.textShadow).toContain('30px');
  });
});
