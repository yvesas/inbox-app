// Armazenamento em DynamoDB — usado no ambiente hospedado (Lambda).
// Usa o AWS SDK v3 já incluído no runtime do Lambda (nenhuma dependência precisa ser empacotada).
//
// Modelo de tabela única:
//   Conversa:  PK = "TENANT#default"     SK = "CONV#<id>"
//   Mensagem:  PK = "CONV#<id>"          SK = "MSG#<createdAt>#<id>"

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { conversations as seedConversations, messages as seedMessages, TENANT } from "./seed.mjs";

const TABLE = process.env.TABLE_NAME;
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const convPk = () => `TENANT#${TENANT}`;
const convSk = (id) => `CONV#${id}`;
const msgPk = (convId) => `CONV#${convId}`;
const msgSk = (m) => `MSG#${m.createdAt}#${m.id}`;

export function createDynamoStore() {
  return {
    async listConversations() {
      const out = await doc.send(
        new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: { ":pk": convPk(), ":sk": "CONV#" },
        }),
      );
      return (out.Items ?? []).map(stripKeys);
    },

    async getConversation(id) {
      const out = await doc.send(
        new GetCommand({ TableName: TABLE, Key: { PK: convPk(), SK: convSk(id) } }),
      );
      return out.Item ? stripKeys(out.Item) : null;
    },

    async listMessages(convId) {
      const out = await doc.send(
        new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: { ":pk": msgPk(convId), ":sk": "MSG#" },
        }),
      );
      return (out.Items ?? []).map(stripKeys);
    },

    async addMessage(convId, message) {
      await doc.send(
        new PutCommand({
          TableName: TABLE,
          Item: { PK: msgPk(convId), SK: msgSk(message), ...message },
        }),
      );
    },

    async updateConversation(convId, patch) {
      const names = {};
      const values = {};
      const sets = [];
      for (const [k, v] of Object.entries(patch)) {
        names[`#${k}`] = k;
        values[`:${k}`] = v;
        sets.push(`#${k} = :${k}`);
      }
      await doc.send(
        new UpdateCommand({
          TableName: TABLE,
          Key: { PK: convPk(), SK: convSk(convId) },
          UpdateExpression: `SET ${sets.join(", ")}`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
        }),
      );
    },

    async seed() {
      const items = [];
      for (const c of seedConversations) {
        items.push({ PutRequest: { Item: { PK: convPk(), SK: convSk(c.id), ...c } } });
      }
      for (const [convId, msgs] of Object.entries(seedMessages)) {
        for (const m of msgs) {
          items.push({ PutRequest: { Item: { PK: msgPk(convId), SK: msgSk(m), ...m } } });
        }
      }
      // BatchWrite aceita no máximo 25 itens por chamada.
      for (let i = 0; i < items.length; i += 25) {
        await doc.send(new BatchWriteCommand({ RequestItems: { [TABLE]: items.slice(i, i + 25) } }));
      }
      return { conversations: seedConversations.length, items: items.length };
    },
  };
}

function stripKeys({ PK, SK, ...rest }) {
  return rest;
}
