import * as UECA from "ueca-react";
import { Block, UIBaseModel, UIBaseParams, UIBaseStruct, useUIBase } from "@components";

type StructNotebook<T extends string = string> = UIBaseStruct<{
    props: {
        pages: NotebookPage<T>[];
        activePage: T;
        history: boolean;
        __historyStack: T[];
        __closingLastPage: boolean;
    };

    methods: {
        /**
         * Open a page(s) with history reset.
         * @param pages The list of pages to open. If more than one page provided the last becomes active and the rest go to the history.
         */
        open: (...pages: T[]) => void;

        /**
         * Closes all open pages with history reset.
         */
        close: () => void;

        /**
         * Close the active page and opens previous page from history.
         */
        closeLastPage: () => void;
    };
}>;

type NotebookParams<T extends string = string> = UIBaseParams<StructNotebook<T>>;
type NotebookModel<T extends string = string> = UIBaseModel<StructNotebook<T>>;

type NotebookPage<T> = {
    id: T;
    view: React.ReactNode;
}

function useNotebook<T extends string = string>(params?: NotebookParams<T>): NotebookModel<T> {
    const struct: StructNotebook<T> = {
        props: {
            id: useNotebook.name,
            pages: [],
            activePage: undefined,
            history: false
        },

        methods: {
            open: (...pages: T[]) => {
                _historyClear();
                if (!pages || !pages.length) return;
                model.history = true;
                pages = pages.filter(p => !!p);
                model.activePage = pages.pop();
                _historyPush(...pages);
            },

            close: () => {
                _historyClear();
                model.activePage = undefined;
            },

            closeLastPage: () => {
                let prevPage: T;
                do {
                    prevPage = _historyPop();
                } while (prevPage === model.activePage);
                model.__closingLastPage = true;
                model.activePage = prevPage;
                model.__closingLastPage = false;
            }
        },

        events: {
            onChangingActivePage: (newPage, prevPage) => {
                if (model.history && !model.__closingLastPage) {
                    const lastPage = _historyPop();
                    if (newPage !== lastPage) {
                        if (lastPage) {
                            _historyPush(lastPage);
                        }
                        if (prevPage) {
                            _historyPush(prevPage);
                        }
                    }
                }
                return newPage;
            },

            onChangeHistory: () => _historyClear()
        },

        init: () => _historyClear(),

        View: () =>
            <Block id={model.htmlId()}>
                {UECA.renderNode(_getActivePanel().view)}
            </Block>

    };

    const model = useUIBase(struct, params) as NotebookModel<T>;
    return model;

    // Private methods
    function _getActivePanel(): NotebookPage<T> {
        const panel = model.pages.find(x => x.id === model.activePage);
        return panel ?? {
            id: undefined,
            view: undefined
        };
    }

    function _historyPush(...pages: T[]) {
        pages?.forEach((p) => model.__historyStack.push(p));
    }

    function _historyPop() {
        return model.__historyStack.pop();
    }

    function _historyClear() {
        model.__historyStack = [];
    }
}

const Notebook = UECA.getFC(useNotebook);

export { NotebookPage, NotebookParams, NotebookModel, useNotebook, Notebook };
