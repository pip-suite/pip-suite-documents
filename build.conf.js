module.exports = {
    module: {
        name: 'pipDocuments',
        styles: 'index',
        export: 'pip.documents',
        standalone: 'pip.documents'
    },
    build: {
        js: false,
        ts: false,
        tsd: true,
        bundle: true,
        html: true,
        sass: true,
        lib: true,
        images: true,
        dist: false
    },
    file: {
        lib: [
            '../node_modules/pip-webui-all/dist/**/*',
            '../pip-suite-rest/dist/**/*',
            '../pip-suite-entry/dist/**/*'
        ]
    },
    samples: {
        port: 8198,
        https: false
    },
    api: {
        port: 8111
    }
};
