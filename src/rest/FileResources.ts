function configFileResources(pipRestProvider: pip.rest.IRestProvider) {
    pipRestProvider.registerPagedCollection('files', '/api/1.0/files/:file_id');
}
// this.registerRoute('get', '/files', this.getFiles);
// this.registerRoute('get', '/files/:file_id', this.getFile);
// this.registerRouteWithAuth('post', '/files', this._auth.admin(), this.createFile);
// this.registerRouteWithAuth('put', '/files/:file_id', this._auth.admin(), this.updateFile);
// this.registerRouteWithAuth('del', '/files/:file_id', this._auth.admin(), this.deleteFile);

angular
    .module('pipDocuments.Rest')
    .config(configFileResources);
