import { HoverPopover, ItemView, WorkspaceLeaf } from 'obsidian';
import { App as VueApp, createApp } from 'vue';
import type ObsidianManagerPlugin from 'main';
import Title from '../Title';
import t from '../../i18n';

export const POMODORO_VIEW = 'pomodoro-view';

export class PomodoroView extends ItemView {
    vueapp: VueApp;
    plugin: ObsidianManagerPlugin;
    hoverPopover: HoverPopover | null;

    constructor(leaf: WorkspaceLeaf, plugin: ObsidianManagerPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType() {
        return POMODORO_VIEW;
    }

    getDisplayText(): string {
        return t.info.Pomodoro;
    }

    getIcon(): string {
        return 'clock';
    }

    async onOpen(): Promise<void> {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('div', {
            attr: {
                id: 'awesome-brain-manager-pomodoro-view',
            },
        });
        this.vueapp = createApp(Title, { plugin: this.plugin });
        this.vueapp.mount('#awesome-brain-manager-pomodoro-view');
    }

    async onClose() {
        this.vueapp.unmount();
    }
}
