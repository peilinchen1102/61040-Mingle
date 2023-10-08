import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface MessageDoc extends BaseDoc {
  from: ObjectId;
  to: ObjectId;
  content: string;
}

export default class MessageConcept {
  public readonly messages = new DocCollection<MessageDoc>("messages");

  async getMessages(user: ObjectId) {
    return await this.messages.readMany(
      {
        $or: [{ from: user }, { to: user }],
      },
      {
        sort: { dateUpdated: -1 },
      },
    );
  }

  async getMessagesBetween(user1: ObjectId, user2: ObjectId) {
    return await this.messages.readMany({ from: user1, to: user2 }, { sort: { dateCreated: -1 } });
  }

  async sendMessage(from: ObjectId, to: ObjectId, content: string) {
    await this.canSendMessage(from, to);
    await this.messages.createOne({ from, to, content });
    return { msg: "Message sent!" };
  }

  private async canSendMessage(u1: ObjectId, u2: ObjectId) {
    if (u1.toString() === u2.toString()) {
      throw new CannotMessageSelfError(u1);
    }
  }
}

export class CannotMessageSelfError extends NotAllowedError {
  constructor(public readonly user: ObjectId) {
    super("Message cannot be sent to yourself!");
  }
}