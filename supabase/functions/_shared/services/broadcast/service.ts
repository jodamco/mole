import { UpstashService } from "./upstash.ts";
import { Topic } from "./types.ts";
import type { PublishMessage, PubSubService } from "./types.ts";

export { Topic };
export type { PublishMessage, PubSubService };

export class BroadcastService {
  private service: PubSubService;

  constructor(service?: PubSubService) {
    this.service = service ?? new UpstashService();
  }

  async broadcastMessage(message: PublishMessage): Promise<void> {
    await this.service.publish(message);
  }
}
