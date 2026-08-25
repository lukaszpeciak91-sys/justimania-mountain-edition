export default class AscentTracker {
  constructor(startY) {
    this.startY = startY;
    this.minimumY = startY;
    this.current = 0;
  }

  update(playerY) {
    this.minimumY = Math.min(this.minimumY, playerY);
    this.current = Math.max(0, Math.floor(this.startY - this.minimumY));
    return this.current;
  }
}
