const MAX_EVENTS = 10;

export function inputDebugEnabled(search = globalThis.location?.search ?? '') {
  return new URLSearchParams(search).get('inputdebug') === '1';
}

export function createInputDiagnostics({ enabled = inputDebugEnabled(), maxEvents = MAX_EVENTS } = {}) {
  const events = [];
  let display = null;

  const refresh = () => {
    display?.setText(['INPUT DEBUG', ...events.map((event, index) => `${index + 1} ${event}`)]);
  };

  return {
    enabled,
    record(stage) {
      if (!enabled) return;
      events.push(stage);
      if (events.length > maxEvents) events.splice(0, events.length - maxEvents);
      refresh();
    },
    history() {
      return [...events];
    },
    attach(scene) {
      if (!enabled) return null;
      display = scene.add.text(8, 8, '', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 5, y: 4 },
        lineSpacing: 1,
      }).setOrigin(0, 0).setScrollFactor(0).setDepth(500);
      display.disableInteractive();
      refresh();
      return display;
    },
  };
}

export const inputDiagnostics = createInputDiagnostics();
