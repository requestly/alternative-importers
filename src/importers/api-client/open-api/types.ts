 type PathGroup = {
    path: string;
    methods: string[];
}

export type PathGroupMap = Record<string, PathGroup[]>;

type NestedCollection = {
    name: string;
    path: string;
    children: Record<string, NestedCollection>;
    requests: PathGroup[];
}

export type NestedCollectionMap = Record<string, NestedCollection>;