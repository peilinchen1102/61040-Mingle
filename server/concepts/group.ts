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
    if (!members.includes(owner)) {
      throw new OwnerMustBeAMemberError();
    }
    await this.groups.createOne({ name, owner, members, messages: [] });
    return { msg: "Group successfully created!" };
  }

  async getGroups(user: ObjectId) {
    const groups = await this.groups.readMany({ $match: { members: user } });
    return groups;
  }

  async getGroupByName(name: string) {
    const group = await this.groups.readOne({ name: name });
    if (group === null) {
      throw new NotFoundError(`Group not found!`);
    }
    return group;
  }

  async join(user: ObjectId, name: string) {
    const group = await this.getGroupByName(name);
    await this.canUserJoinGroup(user, group._id);
    group.members.push(user);
    return { msg: "Joined group successfully!" };
  }

  async leave(user: ObjectId, name: string) {
    const group = await this.getGroupByName(name);
    await this.canUserLeaveGroup(user, group._id);
    const idx = group.members.indexOf(user);
    group.members.splice(idx);
    return { msg: "Left group successfully!" };
  }

  async delete(user: ObjectId, name: string) {
    const group = await this.getGroupByName(name);
    await this.isGroupOwner(user, group._id);
    await this.groups.deleteOne({ name });
    return { msg: "Group deleted!" };
  }

  async removeMember(user: ObjectId, name: string, member: ObjectId) {
    const group = await this.getGroupByName(name);
    await this.isGroupOwner(user, group._id);
    await this.canUserLeaveGroup(member, group._id);
    const idx = group.members.indexOf(member);
    group.members.splice(idx);
    return { msg: "Member successfully removed!" };
  }

  async isGroupOwner(user: ObjectId, group: ObjectId) {
    const maybeGroup = await this.groups.readOne({ owner: user });

    if (maybeGroup?._id.toString() !== group.toString()) {
      throw new UnauthenticatedError("User {0} is not the owner of group {1}", user, group);
    }
  }

  private async canUserJoinGroup(user: ObjectId, group: ObjectId) {
    const maybeGroup = await this.groups.readOne({ group, $match: { members: user } });
    if (maybeGroup !== null) {
      throw new UserAlreadyInGroupError(user, group);
    }
  }

  private async canUserLeaveGroup(user: ObjectId, group: ObjectId) {
    const maybeGroup = await this.groups.readOne({ group, $match: { members: user } });
    if (maybeGroup === null) {
      throw new NotFoundError(`User {0} not found in group {1}`, user, group);
    }

    if (maybeGroup.owner.toString() === user.toString()) {
      throw new OwnerCannotLeaveGroupError(user, group);
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

export class OwnerCannotLeaveGroupError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly group: ObjectId,
  ) {
    super("Owner {0} cannot leave group {1}", owner, group);
  }
}
export class OwnerMustBeAMemberError extends NotAllowedError {
  constructor() {
    super("Owner must be a member of the group");
  }
}
