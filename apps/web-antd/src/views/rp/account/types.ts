export interface DropDownOption {
  label: string;
  value: any;
  extraData: any;
}

export interface DropDownOptionsGroup {
  label: string;
  options: DropDownOption[];
}
