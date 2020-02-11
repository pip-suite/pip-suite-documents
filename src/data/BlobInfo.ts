export class BlobInfo {

    public constructor(id: string, group: string, name: string, size?: number,
        content_type?: string, create_time?: Date, expire_time?: Date, completed?: boolean) {
        this.id = id;
        this.group = group;
        this.name = name;
        this.size = size;
        this.content_type = content_type;
        this.create_time = create_time;
        this.expire_time = expire_time;
        this.completed = completed;
    }

    /* Identification */
    public id: string;
    public group: string;
    public name: string;

    /* Content */
    public size: number;
    public content_type: string;
    public create_time: Date;
    public expire_time: Date;
    public completed: boolean;
}