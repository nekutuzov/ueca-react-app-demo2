import * as UECA from "ueca-react";
import { BaseModel, BaseParams, BaseStruct, useBase } from "@components";

type FileSelectorStruct = BaseStruct<{
    methods: {
        select: (fileMask: string, multiselect?: boolean) => Promise<File[]>;
    }
}>;

type FileSelectorModel = BaseModel<FileSelectorStruct>;

function useFileSelector(params?: BaseParams<FileSelectorStruct>): FileSelectorModel {
    const struct: FileSelectorStruct = {
        props: {
            id: useFileSelector.name,
        },

        methods: {
            select: async (fileMask, multiselect) => {
                const files = await _selectFiles(fileMask, multiselect);
                return files?.length ? files : undefined;
            },
        },

        View: () => <input id={model.htmlId()} type={"file"} hidden />
    }

    const model = useBase(struct, params);
    return model;


    // Private methods
    async function _selectFiles(fileMask: string, multiselect: boolean): Promise<File[]> {
        const promise = new Promise<File[]>((resolve) => {
            const input = document.getElementById(model.htmlId()) as HTMLInputElement;
            if (!input) {
                throw Error(`DOM element id="${model.htmlId()}" not found`);
            }

            input.accept = fileMask;
            input.multiple = multiselect;

            input.onchange = () => {
                if (!input.files?.length) {
                    resolve(undefined);
                } else {
                    const files: File[] = [];
                    for (let i = 0; i < input.files.length; i++) {
                        files.push(input.files[i]);
                    }
                    resolve(files);
                }
            }

            const oldOnFocus = document.body.onfocus;
            document.body.onfocus = () => {
                document.body.onfocus = oldOnFocus;
                setTimeout(() => {
                    if (!input.files.length) {
                        resolve(undefined);
                    }
                }, 100);
            };

            setTimeout(() => {
                input.focus();
                input.click();
            });
        });

        return promise;
    }
}

const FileSelector = UECA.getFC(useFileSelector);

export { FileSelectorModel, useFileSelector, FileSelector }
