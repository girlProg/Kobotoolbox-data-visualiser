export interface KoboAsset {
  uid: string;
  name: string;
  asset_type: string;
  date_created: string;
  date_modified: string;
  deployment__submission_count: number;
  deployment_status: string;
  content?: KoboFormContent;
}

export interface KoboFormContent {
  survey: KoboSurveyField[];
  choices: KoboChoice[];
}

export interface KoboSurveyField {
  type: string;
  name: string;
  label?: string | string[];
  select_from_list_name?: string;
  $kuid?: string;
}

export interface KoboChoice {
  list_name: string;
  name: string;
  label?: string | string[];
}

export interface KoboSubmission {
  _id: number;
  _submission_time: string;
  _geolocation?: [number, number] | null;
  [key: string]: unknown;
}

export interface KoboDataResponse {
  count: number;
  results: KoboSubmission[];
}

export interface KoboAssetsResponse {
  count: number;
  results: KoboAsset[];
}

export interface ParsedGpsPoint {
  lat: number;
  lng: number;
}

export interface AggregatedChoice {
  label: string;
  count: number;
}

export interface TimeSeriesPoint {
  week: string;
  count: number;
}
