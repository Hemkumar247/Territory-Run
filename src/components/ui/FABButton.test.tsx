import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { FABButton } from './FABButton';

describe('FABButton', () => {
    it('renders default text fallback', () => {
        render(<FABButton>Trigger</FABButton>);
        expect(screen.getByRole('button').textContent).toContain('Trigger');
    });

    it('renders label prop', () => {
        render(<FABButton label="Start" />);
        expect(screen.getByText('Start')).toBeDefined();
    });

    it('renders custom classes and standard types', () => {
        render(<FABButton className="custom-test" variant="danger" label="Danger Action" />);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('custom-test');
        expect(btn.textContent).toContain('Danger Action');
    });
});
