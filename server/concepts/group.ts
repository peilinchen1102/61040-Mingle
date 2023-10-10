import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError, UnauthenticatedError } from "./errors";

export interface GroupDoc extends BaseDoc {
  name: string;
  owner: ObjectId;
  members: Array<ObjectId>;
  messages: Array<ObjectId>;
}

export default class GroupConcept {
  public readonly groups = new DocCollection<GroupDoc>("groups");

  async create(name: string, owner: ObjectId, members: Array<ObjectId>) {
    await this.isGroupNameUnique(name);
    if (!members.map((member) => member.toString()).includes(owner.toString())) {
      throw new OwnerMustBeAMemberError();
    }
    await this.groups.createOne({ name, owner, members, messages: [] });
    return { msg: "Group successfully created!" };
  }

  async getGroups(user: ObjectId, groupName?: string) {
    if (groupName) {
      return await this.groups.readMany({ members: user, name: groupName }, { sort: { dateUpdated: -1 } });
    } else {
      return await this.groups.readMany({ members: user }, { sort: { dateUpdated: -1 } });
    }
  }

  async getGroupByName(name: string) {
    const group = await this.groups.readOne({ name: name });
    if (group === null) {
      throw new NotFoundError(`Group not found!`);
    }
    return group;
  }

  async getGroupNameByIds(_ids: ObjectId[]) {
    const groups = await this.groups.readMany({ _id: { $in: _ids } }, { sort: { dateUpdated: -1 } });
    if (groups == null) {
      throw new NotFoundError(`Group not found!`);
    }
    return groups.map((group) => group.name);
  }

  async join(user: ObjectId, name: string) {
    const group = await this.getGroupByName(name);
    await this.canUserJoinGroup(user, group._id);
    const members = group.members;
    members.push(user);
    await this.groups.updateOne({ _id: group._id }, { ...group, members: members });
    return { msg: "Joined group successfully!" };
  }

  async leave(user: ObjectId, name: string) {
    const group = await this.getGroupByName(name);
    await this.canUserLeaveGroup(user, group._id);
    const members = group.members;
    const idx = members.indexOf(user);
    members.splice(idx);

    await this.groups.updateOne({ _id: group._id }, { ...group, members: members });
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
    const members = group.members;
    const idx = members.indexOf(member);
    members.splice(idx);

    await this.groups.updateOne({ _id: group._id }, { members: members });
    return { msg: "Member successfully removed!" };
  }

  async isGroupOwner(user: ObjectId, group: ObjectId) {
    const maybeGroup = await this.groups.readOne({ _id: group });

    if (maybeGroup?.owner.toString() !== user.toString()) {
      throw new UnauthenticatedError("User {0} is not the owner of group {1}", user, group);
    }
  }

  async isGroupMember(user: ObjectId, groupName: string) {
    const group = await this.getGroupByName(groupName);
    const members = group.members.map((member) => member.toString());
    if (!members.includes(user.toString())) {
      throw new UserNotInGroupError(user);
    }
  }

  async addMessage(groupName: string, messageId: ObjectId) {
    const group = await this.getGroupByName(groupName);
    const messages = group.messages;
    messages.push(messageId);
    await this.groups.updateOne({ _id: group._id }, { messages: messages });
    return { msg: "Message added to group successfully!" };
  }

  private async canUserJoinGroup(user: ObjectId, group: ObjectId) {
    const maybeGroup = await this.groups.readOne({ _id: group, members: user });
    if (maybeGroup !== null) {
      throw new UserAlreadyInGroupError();
    }
  }

  private async canUserLeaveGroup(user: ObjectId, group: ObjectId) {
    const maybeGroup = await this.groups.readOne({ _id: group, members: user });
    if (maybeGroup === null) {
      throw new NotFoundError(`User not found in group`);
    }

    if (maybeGroup.owner.toString() === user.toString()) {
      throw new OwnerCannotLeaveGroupError();
    }
  }

  async groupExist(_id: ObjectId) {
    const maybeGroup = await this.groups.readOne({ _id: _id });
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
  constructor() {
    super("You are already in the group!");
  }
}

export class UserNotInGroupError extends NotAllowedError {
  constructor(user: ObjectId) {
    super("User {0} is not a member of the group", user);
  }
}

export class OwnerCannotLeaveGroupError extends NotAllowedError {
  constructor() {
    super("You are the owner and cannot leave the group!");
  }
}
export class OwnerMustBeAMemberError extends NotAllowedError {
  constructor() {
    super("Owner must be a member of the group");
  }
}
