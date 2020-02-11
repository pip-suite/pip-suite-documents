export class DataPage<T> {
    public constructor(data: T[] = null, total: number = null) {
		this.total = total;
		this.data = data;
	}

    public total: number;
    public data: T[];
}