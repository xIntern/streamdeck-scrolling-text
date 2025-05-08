import { action, SingletonAction, WillAppearEvent, KeyDownEvent, DidReceiveSettingsEvent } from "@elgato/streamdeck";
import { ScrollText, ScrollMode, ScrollDirection } from "../scrollText";

@action({ UUID: "com.aw.scroll-text.scroll" })
export class ScrollTextAction extends SingletonAction<ScrollTextSettings> {
  private scroller: ScrollText | null = null;
  private lastSettings: ScrollTextSettings = {};
  private paused: boolean = false;

  private setupScroller(settings: ScrollTextSettings, action: any) {
    const text = settings.text ?? "Scroll me!";
    const windowSize = settings.windowSize ?? 9;
    const interval = settings.interval ?? 300;
    const mode: ScrollMode = settings.mode ?? "loop";
    const direction: ScrollDirection = settings.direction ?? "left";
    const pauseAfterScroll: number = settings.pauseAfterScroll ?? 0;
    this.scroller?.stop();
    this.scroller = new ScrollText(
      text,
      windowSize,
      interval,
      (frame) => action.setTitle(frame),
      mode,
      direction,
      pauseAfterScroll
    );
    if (!this.paused) {
      this.scroller.start();
    }
    action.setTitle(this.scroller.getCurrentFrame());
  }

  private async fetchTitleFromAPI(): Promise<string | null> {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
      const data: any = await response.json();
      return data.title || null;
    } catch (e) {
      console.error('Error fetching title from API:', e);
      return null;
    }
  }

  override async onWillAppear(ev: WillAppearEvent<ScrollTextSettings>): Promise<void> {
    this.lastSettings = ev.payload.settings;
    // Example: Fetch text from a demo API and set it as the scroll text
    const title = await this.fetchTitleFromAPI();
    if (title) {
      const newSettings = { ...ev.payload.settings, text: title };
      this.setupScroller(newSettings, ev.action);
      return;
    } else {
      this.setupScroller(ev.payload.settings, ev.action);
    }
  }

  override onDidReceiveSettings(ev: DidReceiveSettingsEvent<ScrollTextSettings>): void | Promise<void> {
    if (this.scroller && typeof ev.payload.settings.pauseAfterScroll === 'number') {
      this.scroller.setPauseAfterScroll(ev.payload.settings.pauseAfterScroll);
    }
    if (this.scroller && ev.payload.settings.text === '') {
      this.fetchTitleFromAPI().then((title) => {
        if (title) {
          const newSettings = { ...ev.payload.settings, text: title };
          this.setupScroller(newSettings, ev.action);
          this.lastSettings = newSettings;
          return;
        }
      });
    }
    this.lastSettings = ev.payload.settings;
    this.setupScroller(ev.payload.settings, ev.action);
  }

  override onWillDisappear(): void | Promise<void> {
    this.scroller?.stop();
    this.scroller = null;
  }

  override onKeyDown(ev: KeyDownEvent<ScrollTextSettings>): void | Promise<void> {
    if (this.paused) {
      this.scroller?.start();
      this.paused = false;
    } else {
      this.scroller?.stop();
      this.paused = true;
    }
  }
}

type ScrollTextSettings = {
  text?: string;
  windowSize?: number;
  interval?: number;
  mode?: ScrollMode;
  direction?: ScrollDirection;
  pauseAfterScroll?: number;
}; 