import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface StatusDoc extends BaseDoc {
  owner: ObjectId;
  userStatus: "active" | "away" | "busy";
  curAssignment: string;
}

export default class StatusConcept {
  public readonly statuses = new DocCollection<StatusDoc>("statuses");

  async create(owner: ObjectId) {
    // status has never been created, set to default
    const _id = await this.statuses.createOne({ owner, userStatus: "active", curAssignment: "" });
    return { msg: "Status successfully created!", status: await this.statuses.readOne({ _id }) };
  }

  async getStatus(_id: ObjectId) {
    const status = await this.statuses.readOne({ owner: _id });
    if (status == null) {
      throw new NotFoundError(`Status not found!`);
    }
    return status;
  }

  async update(owner: ObjectId, update: Partial<StatusDoc>) {
    await this.statuses.updateOne({ owner }, update);
    return { msg: "Status succefully updated!" };
  }

  async isSameAssignment(_id1: ObjectId, _id2: ObjectId) {
    const user1 = await this.getStatus(_id1);
    const user2 = await this.getStatus(_id2);

    if (user1.curAssignment == user2.curAssignment) {
      return true;
    }
    return false;
  }
}
