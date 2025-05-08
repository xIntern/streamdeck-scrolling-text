export type ScrollMode = "loop" | "bounce";
export type ScrollDirection = "left" | "right";

export class ScrollText {
  private text: string;
  private windowSize: number;
  private interval: number;
  private timer: NodeJS.Timeout | null = null;
  private position: number = 0;
  private onUpdate: (frame: string) => void;
  private mode: ScrollMode;
  private direction: ScrollDirection;
  private bounceForward: boolean = true;
  private pauseAfterScroll: number;
  private isPaused: boolean = false;

  constructor(
    text: string,
    windowSize: number,
    interval: number,
    onUpdate: (frame: string) => void,
    mode: ScrollMode = "loop",
    direction: ScrollDirection = "left",
    pauseAfterScroll: number = 0
  ) {
    this.text = text;
    this.windowSize = windowSize;
    this.interval = interval;
    this.onUpdate = onUpdate;
    this.mode = mode;
    this.direction = direction;
    this.pauseAfterScroll = pauseAfterScroll;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.advanceWithPause();
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isPaused = false;
  }

  private advanceWithPause() {
    if (this.isPaused) return;
    const prevPos = this.position;
    const prevBounce = this.bounceForward;
    this.advance();
    this.onUpdate(this.getCurrentFrame());
    // Check if we completed a loop or bounce
    if (this.pauseAfterScroll > 0) {
      if (this.mode === "loop") {
        if (
          (this.direction === "left" && prevPos === this.text.length) ||
          (this.direction === "right" && prevPos === 0)
        ) {
          this.pauseTemporarily();
        }
      } else if (this.mode === "bounce") {
        if (
          (prevBounce && this.position === this.text.length - this.windowSize) ||
          (!prevBounce && this.position === 0)
        ) {
          this.pauseTemporarily();
        }
      }
    }
  }

  private pauseTemporarily() {
    this.isPaused = true;
    setTimeout(() => {
      this.isPaused = false;
    }, this.pauseAfterScroll);
  }

  private advance() {
    if (this.text.length <= this.windowSize) return;
    if (this.mode === "loop") {
      if (this.direction === "left") {
        this.position = (this.position + 1) % (this.text.length + 1);
      } else {
        this.position = (this.position - 1 + this.text.length + 1) % (this.text.length + 1);
      }
    } else if (this.mode === "bounce") {
      if (this.bounceForward) {
        this.position++;
        if (this.position > this.text.length - this.windowSize) {
          this.position = this.text.length - this.windowSize;
          this.bounceForward = false;
        }
      } else {
        this.position--;
        if (this.position < 0) {
          this.position = 0;
          this.bounceForward = true;
        }
      }
    }
  }

  getCurrentFrame(): string {
    if (this.text.length <= this.windowSize) {
      return this.text;
    }
    let start = this.position;
    let end = start + this.windowSize;
    if (end <= this.text.length) {
      return this.text.substring(start, end);
    } else {
      // Wrap around for loop mode
      if (this.mode === "loop") {
        return (
          this.text.substring(start) +
          ' '.repeat(end - this.text.length) +
          this.text.substring(0, end - this.text.length)
        ).substring(0, this.windowSize);
      } else {
        // For bounce, just pad with spaces
        return this.text.substring(start) + ' '.repeat(end - this.text.length);
      }
    }
  }

  setText(text: string) {
    this.text = text;
    this.position = 0;
  }

  setWindowSize(size: number) {
    this.windowSize = size;
  }

  setIntervalMs(interval: number) {
    this.interval = interval;
    if (this.timer) {
      this.stop();
      this.start();
    }
  }

  setMode(mode: ScrollMode) {
    this.mode = mode;
    this.position = 0;
    this.bounceForward = true;
  }

  setDirection(direction: ScrollDirection) {
    this.direction = direction;
    this.position = 0;
  }

  setPauseAfterScroll(pause: number) {
    this.pauseAfterScroll = pause;
  }

  // For property inspector preview
  static previewFrame(
    text: string,
    windowSize: number,
    position: number,
    mode: ScrollMode,
    direction: ScrollDirection
  ): string {
    if (text.length <= windowSize) return text;
    let start = position;
    let end = start + windowSize;
    if (end <= text.length) {
      return text.substring(start, end);
    } else {
      if (mode === "loop") {
        return (
          text.substring(start) +
          ' '.repeat(end - text.length) +
          text.substring(0, end - text.length)
        ).substring(0, windowSize);
      } else {
        return text.substring(start) + ' '.repeat(end - text.length);
      }
    }
  }
} 