import { Client, Receiver } from "npm:@upstash/qstash@^2";
import { Topic } from "./types.ts";
import type { PublishMessage, PubSubService, ReceivedMessage } from "./types.ts";

const projectId = Deno.env.get("SUPABASE_PROJECT_ID") ?? "<project_id>";

const TOPIC_URL_MAP: Record<Topic, string> = {
  [Topic.DOCUMENT_UPLOADED]:
    `https://${projectId}.supabase.co/functions/v1/chunk`,
  [Topic.DOCUMENT_CHUNKED]:
    `https://${projectId}.supabase.co/functions/v1/embed-chunks`,
};

export class UpstashService implements PubSubService {
  private client: Client;
  private receiver: Receiver;
  readonly signatureHeader = "Upstash-Signature";

  constructor() {
    const token = Deno.env.get("QSTASH_TOKEN");
    if (!token) {
      throw new Error("QSTASH_TOKEN environment variable is required");
    }
    this.client = new Client({ token });

    const currentSigningKey = Deno.env.get("QSTASH_CURRENT_SIGNING_KEY");
    const nextSigningKey = Deno.env.get("QSTASH_NEXT_SIGNING_KEY");
    if (!currentSigningKey || !nextSigningKey) {
      throw new Error(
        "QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are required",
      );
    }
    this.receiver = new Receiver({
      currentSigningKey,
      nextSigningKey,
    });
  }

  async publish(message: PublishMessage): Promise<void> {
    const url = TOPIC_URL_MAP[message.topic];
    if (!url) {
      throw new Error(
        `No destination URL configured for topic: ${message.topic}`,
      );
    }

    const result = await this.client.publishJSON({
      url,
      body: {
        type: message.type,
        data: message.data,
      },
    });

    if (!result.messageId) {
      throw new Error(
        `Failed to publish message to topic ${message.topic}: no messageId in response`,
      );
    }
  }

  async verifyAndParse(body: string, signature: string): Promise<ReceivedMessage> {
    const isValid = await this.receiver.verify({
      body,
      signature,
    });

    if (!isValid) {
      throw new Error("Invalid Upstash signature");
    }

    const parsed = JSON.parse(body);
    return {
      type: parsed.type,
      data: parsed.data,
    };
  }
}
