export interface Podcast {
  id: string;
  title: string;
  rawTitle: string;
  dateCode: string;
  youtubeId: string | null;
  feishuUrl: string;
  intro: string[];
  highlights: string[];
  fullText: string;
  ytTitle: string | null;
  ytChannel: string | null;
  ytChannelUrl: string | null;
  ytViews: number | null;
  ytPublished: string | null;
}
