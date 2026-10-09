import { routeUrl } from '../src/routing/application-routes';
import { describe, expect, it, vi } from 'vitest';
import { requireCategoryFocus, requireFirstViewport, settledGeometry, waitForAssuranceRecordPane, waitForBrowserState } from '../scripts/lib/browser-readiness.ts';

describe('current browser readiness and failure contracts', () => {
  it('observes readiness without replaying the action and reports the last mounted/busy state', async () => {
    const read = vi.fn().mockResolvedValue({ mounted: false, busy: 'true', selected: 'Data', focused: 'Reset' });
    await expect(waitForBrowserState(read, (state) => state.mounted && state.busy === 'false', 'missing mount', { timeoutMs: 0 }))
      .rejects.toThrow('state={"mounted":false,"busy":"true","selected":"Data","focused":"Reset"}');
    expect(read).toHaveBeenCalledTimes(1);
  });

  it('rejects wrong keyboard focus before dispatch, including another tab in the same category', () => {
    expect(() => requireCategoryFocus({ selected: 'Data', focused: null, selectedFocused: false }, 'ArrowRight')).toThrow('does not own keyboard focus');
    expect(() => requireCategoryFocus({ selected: 'Data', focused: 'Data', selectedFocused: false }, 'ArrowRight')).toThrow();
    expect(() => requireCategoryFocus({ selected: 'Data', focused: 'Data', selectedFocused: true }, 'ArrowRight')).not.toThrow();
  });

  it('settles consecutive measurements and rejects stable bad geometry without scrolling it into compliance', async () => {
    const positions = [950, 940, 940, 940];
    const read = vi.fn(async () => ({ top: positions.shift() ?? 940, bottom: 980, height: 900 }));
    const box = await settledGeometry(read, '375px heading', { intervalMs: 0 });
    expect(read).toHaveBeenCalledTimes(4);
    expect(() => requireFirstViewport(box.top, box.bottom, box.height, '375px heading')).toThrow('outside first viewport');
    expect(() => requireFirstViewport(-2, 40, 900, 'heading')).toThrow();
    expect(() => requireFirstViewport(-1, 901, 900, 'heading')).not.toThrow();
    expect(() => requireFirstViewport(undefined as any, undefined as any, 900, 'missing heading')).toThrow();
  });

  it('fails boundedly when geometry never settles', async () => {
    await expect(settledGeometry(async () => ({ top: NaN }), 'unstable heading', { timeoutMs: 0 })).rejects.toThrow('geometry settlement timed out');
  });

  it('keeps selected assurance pane readiness mandatory and identifies path, fragment and locale', async () => {
    await expect(waitForAssuranceRecordPane({}, `${routeUrl('assurance.index')}#WCAG-1.1.1`, 'ar', {
      origin: 'http://127.0.0.1:8791', assurancePath: routeUrl('assurance.index'),
      evaluatePage: async () => ({ ready: false, headingText: '', recordId: '' }), sleep: async () => {}, timeoutMs: 2, pollIntervalMs: 1,
    })).rejects.toThrow('page=/assurance state=#WCAG-1.1.1 locale=ar record=WCAG-1.1.1');
  });
});
