import { IDocumentUrlDialogService } from './IDocumentUrlDialogService';

class DocumentUrlDialogService implements IDocumentUrlDialogService {
    private _mdDialog: angular.material.IDialogService;

    constructor($mdDialog: angular.material.IDialogService) {
        this._mdDialog = $mdDialog;
    }

    public show(successCallback?: (result) => void, cancelCallback?: () => void) {
        this._mdDialog.show({
            templateUrl: 'document_url_dialog/DocumentUrlDialog.html',
            clickOutsideToClose: true,
            controller: DocumentUrlDialogController,
            controllerAs: '$ctrl'
        })
            .then(
            (result) => {
                if (successCallback) {
                    successCallback(result);
                }
            });
    }
}


const ConfigDocumentUrlDialogTranslations = (pipTranslateProvider: pip.services.ITranslateProvider) => {
    pipTranslateProvider.translations('en', {
        'DOCUMENT_FROM_WEBLINK': 'Add web link',
        'LINK_DOCUMENT': 'Link to the document...'
    });
    pipTranslateProvider.translations('ru', {
        'DOCUMENT_FROM_WEBLINK': 'Добавить веб ссылку',
        'LINK_DOCUMENT': 'Ссылка на документ...'
    });
}

class DocumentUrlDialogController {
    public url: string = '';
    public invalid: boolean = true;
    public theme: string;
    private ExpressionURI: any;
    private regexURI: any;
    public matchURI: boolean;

    constructor(
        private $log: ng.ILogService,
        private $scope: ng.IScope,
        private $mdDialog: angular.material.IDialogService,
        private $rootScope: ng.IRootScopeService,
        private $timeout: ng.ITimeoutService,
        private $mdMenu
    ) {
        "ngInject";

        this.theme = this.$rootScope[pip.themes.ThemeRootVar];

        this.ExpressionURI = /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i;
        this.regexURI = new RegExp(this.ExpressionURI);
        this.matchURI = false;
    }

    public checkUrl(): void {
        if (this.url.match(this.regexURI)) {
            this.matchURI = true;
        } else {
            this.matchURI = false;
        }

    };

    public onCancelClick(): void {
        this.$mdDialog.cancel();
    };

    public onAddClick(): void {
        this.$mdDialog.hide(this.url);
    };

}

angular
    .module('DocumentUrlDialog', ['ngMaterial', 'pipDocuments.Templates'])
    .service('pipDocumentUrlDialog', DocumentUrlDialogService)
    .config(ConfigDocumentUrlDialogTranslations);