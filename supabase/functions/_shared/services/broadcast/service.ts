import { QstashService } from "./qstash.ts";
import { Topic } from "./types.ts";
import type { PublishMessage, PubSubService, ReceivedMessage } from "./types.ts";

export { Topic };
export type { PublishMessage, PubSubService, ReceivedMessage };

export class BroadcastService {
  private service: PubSubService;

  constructor(service?: PubSubService) {
    this.service = service ?? new QstashService();
  }

  get signatureHeader(): string {
    return this.service.signatureHeader;
  }

  async broadcastMessage(message: PublishMessage): Promise<void> {
    await this.service.publish(message);
  }

  async verifyAndParseMessage(body: string, signature: string): Promise<ReceivedMessage> {
    return await this.service.verifyAndParse(body, signature);
  }
}
