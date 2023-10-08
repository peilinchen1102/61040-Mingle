import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError, UnauthenticatedError } from "./errors";

export interface GroupDoc extends BaseDoc {
  name: string;
  owner: ObjectId;
  members: Array<ObjectId>;
  messages: Array<[ObjectId, string]>;
}

export default class GroupConcept {
  public readonly groups = new DocCollection<GroupDoc>("groups");

  async create(name: string, owner: ObjectId, members: Array<ObjectId>) {
    await this.isGroupNameUnique(name);
    await this.groups.createOne({ name, owner, members, messages: [] });
    return { msg: "Group successfully created!" };
  }

  async getGroups(user: ObjectId) {
    const groups = await this.groups.readMany({ $match: { members: user } });
    return groups;
  }

  async getGroupByName(name: string) {
    const group = await this.groups.readOne({ name: name });
    return group;
  }

  async joinGroup(user: ObjectId, _id: ObjectId) {
    const group = await this.groups.readOne({ _id });
    if (!group) {
      throw new NotFoundError(`Group not found!`);
    }
    await this.canUserJoinGroup(user, group._id);
    group.members.push(user);
    return { msg: "Joined group successfully!" };
  }

  async leaveGroup(user: ObjectId, _id: ObjectId) {
    const group = await this.groups.readOne({ _id });
    if (!group) {
      throw new NotFoundError(`Group not found!`);
    }
    await this.canUserLeaveGroup(user, group._id);
    const idx = group.members.indexOf(user);
    group.members.splice(idx);
    return { msg: "Left group successfully!" };
  }

  async delete(user: ObjectId, group: ObjectId) {
    await this.isGroupOwner(user, group);
    await this.groups.deleteOne({ group });
    return { msg: "Group deleted!" };
  }

  async isGroupOwner(user: ObjectId, group: ObjectId) {
    const maybeGroup = await this.groups.readOne({ owner: user });

    if (maybeGroup?._id.toString() !== group.toString()) {
      throw new UnauthenticatedError("User {0} is not the owner of group {1}", user, group);
    }
  }
  async canUserJoinGroup(user: ObjectId, group: ObjectId) {
    const maybeUser = this.groups.readOne({ group, $match: { members: user } });
    if (maybeUser !== null) {
      throw new UserAlreadyInGroupError(user, group);
    }
  }

  async canUserLeaveGroup(user: ObjectId, group: ObjectId) {
    const maybeUser = this.groups.readOne({ group, $match: { members: user } });
    if (maybeUser === null) {
      throw new NotFoundError(`User {0} not found in group {1}`, user, group);
    }
  }

  async groupExist(_id: ObjectId) {
    const maybeGroup = await this.groups.readOne({ _id });
    if (maybeGroup === null) {
      throw new NotFoundError(`Group not found!`);
    }
  }

  private async isGroupNameUnique(name: string) {
    if (await this.groups.readOne({ name: name })) {
      throw new NotAllowedError(`Group with name ${name} already exists!`);
    }
  }
}

export class UserAlreadyInGroupError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly group: ObjectId,
  ) {
    super("User {0} already in group {1}", user, group);
  }
}
