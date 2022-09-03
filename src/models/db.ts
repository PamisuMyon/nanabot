import { logger } from "mewbot";
import { Collection, Db, MongoClient, Document, Filter, FindCursor, WithId, OptionalUnlessRequiredId, AnyBulkWriteOperation } from "mongodb";
import { Util } from "mewbot";

export class DbUtil {

    protected static _client: MongoClient;
    static db: Db;

    static async connect(uri: string) {
        this._client = new MongoClient(uri);
        this._client.on('error', err => {
            logger.error(err);
        });
        await this._client.connect();
        this.db = this._client.db();
        await this.db.command({ping: 1});
    }
}

export class Col<TSchema extends Document = Document> {

    protected _collectionName: string;
    protected _col!: Collection<TSchema>;
    get col() {
        if (!this._col)
            this._col = DbUtil.db.collection<TSchema>(this._collectionName);
        return this._col;
    }

    constructor(collectionName: string) {
        this._collectionName = collectionName;
    }

    insertOne(doc: TSchema){
        return this.col.insertOne(doc as OptionalUnlessRequiredId<TSchema>);
    }

    inserMany(docs: TSchema[]) {
        return this.col.insertMany(docs as OptionalUnlessRequiredId<TSchema>[]);
    }

    updateOne(filter: Filter<TSchema>, doc: TSchema) {
        return this.col.updateOne(filter, { $set: doc }, { upsert: false });
    }

    upsertOne(filter: Filter<TSchema>, doc: TSchema) {
        return this.col.updateOne(filter, { $set: doc }, { upsert: true });
    }

    upsertMany(filters: string[], docs: TSchema[],) {
        const oprations = [];
        for (const doc of docs) {
            const filter: any = {};
            for (const f of filters) {
                filter[f] = doc[f];
            }
            oprations.push({
                updateOne: {
                    filter,
                    update: { $set: doc },
                    upsert: true
                }
            });
        }
        return this.col.bulkWrite(oprations);
    }

    bulkWrite(operations: AnyBulkWriteOperation<TSchema>[]) {
        return this.col.bulkWrite(operations);
    }

    find(): FindCursor<WithId<TSchema>>;
    find(filter: Filter<TSchema> | void): FindCursor<WithId<TSchema>>;
    find(filter: Filter<TSchema> | void): FindCursor<WithId<TSchema>> {
        if (filter)
            return this.col.find(filter);
        return this.col.find();
    }

    findOne(): Promise<WithId<TSchema> | null>;
    findOne(filter: Filter<TSchema> | void): Promise<WithId<TSchema> | null>;
    findOne(filter: Filter<TSchema> | void): Promise<WithId<TSchema> | null> {
        if (filter)
            return this.col.findOne(filter);
        return this.col.findOne();
    }

    async findFuzzyOne(field: string, value: string) {
        const lengthThreshold = /[a-zA-Z]/.test(value) ? 3 : 2;
        if (value.length < lengthThreshold) return;
        const filter: any = {};
        filter[field] = value;
        filter[field] = { $regex: value, $options:'i' };
        const results = await this.col.find(filter).toArray();
        if (results.length > 0)
            return Util.randomItem(results);
        return;
    }

    deleteMany(filter: Filter<TSchema>) {
        return this.col.deleteMany(filter);
    }

    deleteOne(filter: Filter<TSchema>) {
        return this.col.deleteOne(filter);
    }

}

export class CachedCol<TSchema extends Document = Document> extends Col<TSchema> {

    protected _cache: WithId<TSchema>[] = [];
    get cache() {
        return this._cache;
    }

    async refresh() {
        this._cache = await this.find().toArray();
    }

}
