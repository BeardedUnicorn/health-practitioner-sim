import { afterEach, describe, expect, it, vi } from 'vitest';

const renderMock = vi.hoisted(() => vi.fn());
const createRootMock = vi.hoisted(() => vi.fn(() => ({ render: renderMock })));

vi.mock('react-dom/client', () => ({
  default: {
    createRoot: createRootMock,
  },
}));

vi.mock('../App', () => ({
  default: () => <div data-testid="app" />,
}));

describe('main', () => {
  afterEach(() => {
    vi.resetModules();
    createRootMock.mockClear();
    renderMock.mockClear();
    document.body.innerHTML = '';
  });

  it('renders the app into the root element', async () => {
    document.body.innerHTML = '<div id="root"></div>';

    await import('../main');

    expect(createRootMock).toHaveBeenCalledWith(document.getElementById('root'));
    expect(renderMock).toHaveBeenCalledOnce();
  });
});
