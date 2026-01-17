export interface ObjectTypeDetails {
  key: string;
  valueType: string;
  extraInfo?: string;
  children?: ObjectTypeDetails[];
}
