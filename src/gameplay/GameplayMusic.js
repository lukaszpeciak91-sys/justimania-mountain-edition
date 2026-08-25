export const GAME_MUSIC_VOLUME = 0.32;

export default class GameplayMusic {
  constructor({ soundManager, input, key, available, volume = GAME_MUSIC_VOLUME }) {
    this.soundManager = soundManager;
    this.input = input;
    this.key = key;
    this.available = available;
    this.volume = volume;
    this.music = null;
    this.waitingForInteraction = false;
    this.disposed = false;
    this.handleUnlock = () => this.tryPlay();
    this.handleInteraction = () => {
      this.waitingForInteraction = false;
      this.tryPlay();
    };
  }

  start() {
    if (this.disposed || this.music || !this.available) return false;
    this.music = this.soundManager.add(this.key, { loop: true, volume: this.volume });
    return this.tryPlay();
  }

  makeAvailable() {
    if (this.disposed) return false;
    this.available = true;
    return this.start();
  }

  tryPlay() {
    if (this.disposed || !this.music || this.music.isPlaying) return Boolean(this.music?.isPlaying);
    let started = false;
    try {
      started = this.music.play() !== false;
    } catch {
      started = false;
    }
    if (!started) this.waitForPlaybackPermission();
    return started;
  }

  waitForPlaybackPermission() {
    if (this.disposed) return;
    this.soundManager.off('unlocked', this.handleUnlock);
    this.soundManager.once('unlocked', this.handleUnlock);
    if (!this.waitingForInteraction) {
      this.waitingForInteraction = true;
      this.input.once('pointerdown', this.handleInteraction);
    }
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.soundManager.off('unlocked', this.handleUnlock);
    if (this.waitingForInteraction) this.input.off('pointerdown', this.handleInteraction);
    this.waitingForInteraction = false;
    this.music?.stop();
    this.music?.destroy();
    this.music = null;
  }
}
