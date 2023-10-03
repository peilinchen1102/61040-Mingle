import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export enum UserStatus {
  Active,
  Busy,
  Away,
}
export interface StatusDoc extends BaseDoc {
  owner: ObjectId;
  status: UserStatus;
  curAssignment: string;
}

export default class StatusConcept {
  public readonly statuses = new DocCollection<StatusDoc>("statuses");

  async create(owner: ObjectId) {
    // status has never been created, set to default
    const _id = await this.statuses.createOne({ owner, status: UserStatus.Active, curAssignment: "" });
    return { msg: "Status successfully created!", status: await this.statuses.readOne({ _id }) };
  }

  // async update(owner: ObjectId, Partial<StatusDoc>) {

  // }
}
