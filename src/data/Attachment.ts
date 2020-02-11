export class Attachment {
    public constructor(id?: string, uri?: string, name?: string) {
        this.id = id;
        this.uri = uri;
        this.name = name;
    }
    public id?: string;
    public uri?: string;
    public name?: string;
} 