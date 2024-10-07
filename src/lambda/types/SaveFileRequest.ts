export type SaveFileRequest = {
  account: string;
  filename: string;
  contentJson: any;
  addDateInKey?: boolean;
}