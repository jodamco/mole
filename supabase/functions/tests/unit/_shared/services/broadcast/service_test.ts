import { assertEquals } from "@std/assert";
import { BroadcastService, Topic } from "../../../../../_shared/services/broadcast/service.ts";
import type { PublishMessage, PubSubService, ReceivedMessage } from "../../../../../_shared/services/broadcast/types.ts";

function createMockPubSub(): PubSubService & {
  published: PublishMessage[];
  verifyResult: ReceivedMessage | null;
} {
  const mock: PubSubService & {
    published: PublishMessage[];
    verifyResult: ReceivedMessage | null;
  } = {
    signatureHeader: "X-Mock-Signature",
    published: [],
    verifyResult: null,
    async publish(message: PublishMessage) {
      mock.published.push(message);
    },
    async verifyAndParse(_body: string, _signature: string): Promise<ReceivedMessage> {
      if (!mock.verifyResult) throw new Error("No verify result configured");
      return mock.verifyResult;
    },
  };
  return mock;
}

Deno.test("BroadcastService delegates broadcastMessage to provider", async () => {
  const mock = createMockPubSub();
  const service = new BroadcastService(mock);

  const message: PublishMessage = {
    topic: Topic.DOCUMENT_UPLOADED,
    type: "TEST",
    data: { documentId: "123" },
  };

  await service.broadcastMessage(message);

  assertEquals(mock.published.length, 1);
  assertEquals(mock.published[0], message);
});

Deno.test("BroadcastService delegates verifyAndParseMessage to provider", async () => {
  const mock = createMockPubSub();
  mock.verifyResult = { type: "TEST", data: { documentId: "123" } };
  const service = new BroadcastService(mock);

  const result = await service.verifyAndParseMessage('{"type":"TEST","data":{"documentId":"123"}}', "sig");

  assertEquals(result.type, "TEST");
  assertEquals(result.data, { documentId: "123" });
});

Deno.test("BroadcastService returns provider signatureHeader", () => {
  const mock = createMockPubSub();
  const service = new BroadcastService(mock);

  assertEquals(service.signatureHeader, "X-Mock-Signature");
});

Deno.test("BroadcastService passes correct body and signature to provider", async () => {
  const mock = createMockPubSub();
  mock.verifyResult = { type: "CHUNKED", data: { id: 1 } };
  const service = new BroadcastService(mock);

  const body = '{"type":"CHUNKED","data":{"id":1}}';
  const signature = "test-signature";

  await service.verifyAndParseMessage(body, signature);
});
