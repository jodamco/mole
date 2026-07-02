import { Client } from "npm:@upstash/qstash@^2";
import { Topic } from "./types.ts";
import type { PublishMessage, PubSubService } from "./types.ts";

const projectId = Deno.env.get("SUPABASE_PROJECT_ID") ?? "<project_id>";

const TOPIC_URL_MAP: Record<Topic, string> = {
  [Topic.DOCUMENT_UPLOADED]:
    `https://${projectId}.supabase.co/functions/v1/<endpoint>`,
};

export class UpstashService implements PubSubService {
  private client: Client;

  constructor() {
    const token = Deno.env.get("QSTASH_TOKEN");
    if (!token) {
      throw new Error("QSTASH_TOKEN environment variable is required");
    }
    this.client = new Client({ token });
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
}
