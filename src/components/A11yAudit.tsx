import { useEffect } from 'react';

interface A11yAuditProps {
  enabled?: boolean;
}

export function A11yAudit({ enabled = false }: A11yAuditProps) {
  useEffect(() => {
    if (!enabled || (import.meta as any).env?.MODE !== 'development') return;

    let cancelled = false;

    async function runAudit() {
      try {
        const axe = await import('axe-core');
        const results = await axe.default.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
          },
          resultTypes: ['violations', 'incomplete', 'passes'],
        });

        if (cancelled) return;

        const violations = results.violations;
        const incomplete = results.incomplete;

        if (violations.length > 0) {
          console.group('🔴 Accessibility Violations Found');
          violations.forEach((v: any) => {
            console.group(`[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
            console.log('Help:', v.help);
            console.log('Help URL:', v.helpUrl);
            console.log('Nodes affected:', v.nodes.length);
            v.nodes.forEach((node: any) => {
              console.log('  Target:', node.target);
              console.log('  HTML:', node.html);
              console.log('  Failure summary:', node.failureSummary);
            });
            console.groupEnd();
          });
          console.groupEnd();
        }

        if (incomplete.length > 0) {
          console.group('🟡 Accessibility Items Needing Manual Review');
          incomplete.forEach((v: any) => {
            console.group(`[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
            console.log('Nodes:', v.nodes.length);
            console.groupEnd();
          });
          console.groupEnd();
        }

        const passCount = results.passes.length;
        const violationCount = violations.reduce((sum: number, v: any) => sum + v.nodes.length, 0);
        console.log(`✅ Accessibility Audit Complete: ${passCount} passes, ${violationCount} violations, ${incomplete.length} needs review`);
      } catch (error) {
        console.error('A11y audit failed:', error);
      }
    }

    // Run after a short delay to let React render
    const timer = setTimeout(runAudit, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled]);

  return null;
}