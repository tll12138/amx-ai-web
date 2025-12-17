export interface Group {
  id: string;
  name: string;
  count: number;
}

export interface Account {
  id: string;
  name: string;
  groupId: string;
}
