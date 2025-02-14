import { App, type Editor, Platform } from 'obsidian';
import { type App as VueApp, createApp } from 'vue';
import type AwesomeBrainManagerPlugin from '../main';
import AppVue from '../ui/App.vue';
import { buildTagRules } from '../render/Tag';
import type { SettingModel } from 'model/settings';
import { Tag } from '@/types/types';
import pinia, { useEditorStore } from '@/stores';
import LoggerUtil from '@/utils/logger';

export const appContainerId = 'app-container';
export class EditorUtils {
    plugin: AwesomeBrainManagerPlugin;
    app: App;
    ele: HTMLDivElement;
    loaded = false;
    appViewVueApp: VueApp;
    oldSelection: string;
    currentSelection: string;

    init(plugin: AwesomeBrainManagerPlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
        this.ele = document.body.createEl('div', {
            attr: {
                id: appContainerId,
            },
        });
        this.appViewVueApp = createApp(AppVue);
        this.appViewVueApp.use(pinia);
        this.appViewVueApp.mount(`#${appContainerId}`);
    }

    static getTitleBarHeight(): number {
        if (Platform.isMobile) {
            const titleEl = document.getElementsByClassName('view-header')[5] as HTMLElement | undefined;
            return titleEl?.innerHeight || 40;
        } else {
            const titleEl = document.getElementsByClassName('titlebar')[0] as HTMLElement | undefined;
            return titleEl?.innerHeight || 40;
        }
    }

    static getCurrentSelection(editor: Editor) {
        const cursorPos = editor.getCursor();
        let content = editor.getSelection();
        if (!content) {
            if (cursorPos) {
                content = editor.getLine(cursorPos.line);
            }
        }
        return content;
    }

    static replaceCurrentSelection(editor: Editor, targetText: string) {
        const cursorPos = editor.getCursor();
        const line = editor.getLine(cursorPos.line);
        editor.replaceRange(targetText, { line: cursorPos.line, ch: 0 }, { line: cursorPos.line, ch: line.length });
    }

    unload() {
        if (this.ele) {
            document.body.removeChild(this.ele);
        }
    }

    changeToolbarPopover(e: MouseEvent, toolbarEnable: SettingModel<boolean, boolean>) {
        if (!toolbarEnable.value) {
            return;
        }

        const editor = this.app.workspace.activeEditor?.editor;
        if (!editor) return;
        const position = this.getCoords(editor);
        const activeNode = document.elementFromPoint(position.left, position.top);
        this.currentSelection = editor.getSelection();
        if (this.oldSelection === this.currentSelection) {
            return;
        }
        if (activeNode) {
            this.oldSelection = editor.getSelection();
            useEditorStore().updateCurrentEle(activeNode);
            useEditorStore().updatePosition(position);
            useEditorStore().updateSelection(editor.getSelection());
        }
    }

    getCoords(editor: Editor): { left: number; top: number; right: number; bottom: number } {
        const cursorPos = editor.getCursor();
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return editor.coordsAtPos(cursorPos);
    }

    addTags = (tags: Tag[] = []) => {
        if (tags.length === 0) {
            return;
        }
        document.body.addClass('tag-awesome-brain-manager');
        tags.forEach(tag => {
            const rules = buildTagRules(new Tag(tag[0], tag[1], tag[2], tag[3], tag[4]));
            rules.forEach(rule => this.plugin.style.sheet?.insertRule(rule, this.plugin.style.sheet.cssRules.length));
        });
        this.plugin.updateSnippet();
    };

    static cutLine(editor: Editor) {
        const cursorPos = editor.getCursor();
        const line = editor.getLine(cursorPos.line);
        editor.replaceRange('', { line: cursorPos.line, ch: 0 }, { line: cursorPos.line, ch: line.length });
        navigator.clipboard.writeText(line).then(
            () => {
                LoggerUtil.log('Line cut and copied: ' + line);
            },
            err => {
                LoggerUtil.error('Failed to copy text: ', err);
            },
        );
    }
}

export const EditorUtil = new EditorUtils();
