export enum Topic {
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  DOCUMENT_CHUNKED = "DOCUMENT_CHUNKED",
}

export interface PublishMessage {
  topic: Topic;
  type: string;
  data: Record<string, unknown>;
}

export interface ReceivedMessage {
  type: string;
  data: Record<string, unknown>;
}

export interface PubSubService {
  signatureHeader: string;
  publish(message: PublishMessage): Promise<void>;
  verifyAndParse(body: string, signature: string): Promise<ReceivedMessage>;
}
