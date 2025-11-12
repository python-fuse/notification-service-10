export interface ITemplateDto {
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  language: string;
  latest_version: {
    body: string;
    subject: string;
    version_number: number;
    body_html?: string;
    placeholders?: string[];
  };
}
