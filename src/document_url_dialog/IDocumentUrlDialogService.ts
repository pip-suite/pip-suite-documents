
export interface IDocumentUrlDialogService {
    show(successCallback?: (result: string) => void, cancelCallback?: () => void): any;
}

