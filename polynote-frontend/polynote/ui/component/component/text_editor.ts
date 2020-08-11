import {a, div, TagElement} from "../../util/tags";
import {MarkdownIt} from "../../../util/markdown-it";
import {LaTeXEditor} from "./latex_editor";
import {htmlToMarkdown} from "../../util/html_to_md";
import {TextCellComponent} from "./cell";

export class RichTextEditor {
    constructor(cell: TextCellComponent, readonly element: TagElement<"div">, content: string) {
        if (content)
            this.element.innerHTML = MarkdownIt.render(content);

        this.element.contentEditable = 'true';

        this.element.addEventListener('keydown', (evt) => {
            if (evt.key === 'Tab') {
                evt.preventDefault();
                if (document.queryCommandValue('insertUnorderedList') || document.queryCommandValue('insertOrderedList')) {
                    if (evt.shiftKey)
                        document.execCommand('outdent', false);
                    else
                        document.execCommand('indent', false);
                }
            } else if (evt.metaKey) {
                if (evt.key === 'h') {
                    evt.preventDefault();
                    const blockType = document.queryCommandValue('formatBlock').toLowerCase();
                    const currentHeaderMatch = /^h([1-6])/.exec(blockType);
                    let currentHeader = 0;
                    let nextHeader = 1;
                    if (currentHeaderMatch?.[1]) {
                        currentHeader = parseInt(currentHeaderMatch[1]);
                    }
                    if (currentHeader) {
                        nextHeader = currentHeader + 1;
                        if (nextHeader > 6) {
                            nextHeader = nextHeader % 6;
                        }
                    }
                    document.execCommand('formatBlock', false, `h${nextHeader}`);
                } else if (evt.key === 'e') {
                    evt.preventDefault();
                    LaTeXEditor.forSelection(cell)!.show();
                }
            }
        });

        this.element.addEventListener('click', (evt) => {
            if (evt.target instanceof HTMLAnchorElement) {
                LinkComponent.showFor(evt.target)
            }
        })
    }

    set disabled(disable: boolean) {
        this.element.contentEditable = (!disable).toString();
    }

    focus() {
        this.element.focus();
    }

    get markdownContent() {
        return htmlToMarkdown(this.element);
    }

    get contentNodes() {
        return Array.from(this.element.childNodes)
            // there are a bunch of text nodes with newlines we don't care about.
            .filter(node => !(node.nodeType === Node.TEXT_NODE && node.textContent === '\n'))
    }
}

// TODO: add linky buttons here too, not just on the toolbar.
class LinkComponent {
    readonly el: TagElement<"div">;
    private listener = () => this.hide()

    private constructor(private target: HTMLAnchorElement) {
        this.el = div(['link-component'], [
            a([], target.href, target.href, { target: "_blank" })
        ]).listener("mousedown", evt => evt.stopPropagation())

        document.body.appendChild(this.el);
        document.body.addEventListener("mousedown", this.listener)

        const rect = target.getBoundingClientRect();
        this.el.style.left = `${rect.left}px`
        this.el.style.top = `${rect.bottom}px`
    }

    hide() {
        document.body.removeChild(this.el)
        document.body.removeEventListener("mousedown", this.listener)
    }

    private static inst: LinkComponent;
    static showFor(target: HTMLAnchorElement) {
        const link = new LinkComponent(target)
        if (LinkComponent.inst) {
            LinkComponent.inst.hide()
        }
        LinkComponent.inst = link
        return LinkComponent.inst
    }
}
