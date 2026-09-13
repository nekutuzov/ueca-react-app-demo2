import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase } from "@components";
import { asyncSafe } from "@core";
import "./dropZone.css";

// A reusable full-area file drop target. Owns the drag/over state, the dimmed backdrop, the
// hide transition, and a click-to-pick fallback (via selectFiles). The caller supplies the
// inner content (e.g. a drop card) via contentView and handles dropped files via onDrop.
type DropZoneStruct = BaseStruct<{
    props: {
        contentView: React.ReactNode;
        hidden: boolean;       // hide (fade out + ignore pointer) once content is loaded
        fileMask: string;      // accept filter for the click-to-pick dialog
        multiple: boolean;
        _dragOver: boolean;    // internal: drag-hover visual state
    };

    events: {
        onDrop: (files: File[], source: DropZoneModel) => UECA.MaybePromise;
    };

    methods: {
        openPicker: () => Promise<void>;  // open the native file dialog (wire to your own pick button)
    };
}>;

type DropZoneParams = BaseParams<DropZoneStruct>;
type DropZoneModel = BaseModel<DropZoneStruct>;

function useDropZone(params?: DropZoneParams): DropZoneModel {
    const struct: DropZoneStruct = {
        props: {
            id: useDropZone.name,
            contentView: undefined,
            hidden: false,
            fileMask: "*",
            multiple: false,
            _dragOver: false
        },

        methods: {
            openPicker: async () => {
                const files = await model.selectFiles(model.fileMask, model.multiple);
                if (files && files.length) {
                    await _emit(files);
                }
            }
        },

        View: () => (
            <div
                id={model.htmlId()}
                className={"ueca-dropzone" + (model.hidden ? " hidden" : "") + (model._dragOver ? " over" : "")}
                onDragEnter={(e) => {
                    e.preventDefault();
                    model._dragOver = true;
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    model._dragOver = true;
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.relatedTarget) {
                        model._dragOver = false;
                    }
                }}
                onDrop={_onDrop}
            >
                {model.contentView}
            </div>
        )
    };

    const model = useBase(struct, params);
    return model;

    // Private methods
    function _onDrop(e: React.DragEvent) {
        e.preventDefault();
        model._dragOver = false;
        const files = e.dataTransfer?.files;
        if (files && files.length) {
            asyncSafe(async () => await _emit(Array.from(files)));
        }
    }

    async function _emit(files: File[]) {
        if (model.onDrop) {
            await model.onDrop(files, model);
        }
    }
}

const DropZone = UECA.getFC(useDropZone);

export { DropZoneModel, DropZoneParams, useDropZone, DropZone };
