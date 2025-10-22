 type PathGroup = {
    path: string;
    methods: string[];
}


type NestedCollection = {
    name: string;
    path: string;
    children: Record<string, NestedCollection>;
    requests: PathGroup[];
}

export type NestedCollectionMap = Record<string, NestedCollection>;