export enum Topic {
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
}

export interface PublishMessage {
  topic: Topic;
  type: string;
  data: Record<string, unknown>;
}

export interface PubSubService {
  publish(message: PublishMessage): Promise<void>;
}
