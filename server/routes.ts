import { ObjectId } from "mongodb";
import { Friend, Group, GroupMessage, GroupTask, Message, Post, Profile, Status, Task, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { ProfileDoc } from "./concepts/profile";
import { StatusDoc } from "./concepts/status";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import { Router, getExpressRouter } from "./framework/router";
import Responses from "./responses";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string, name: string, major: string, year: string, courses: Array<string>) {
    WebSession.isLoggedOut(session);
    const user = await User.create(username, password);
    const userInfo = await User.getUserByUsername(username);

    try {
      const profile = await Profile.create(userInfo._id, name, major, year, courses);
      const status = await Status.create(userInfo._id);
      return { msg: "User, Profile, Status successfully created!", user: user.user, profile: profile.profile, status: status.status };
    } catch (e) {
      await User.delete(userInfo._id);
      return { msg: "Account cannot be created!", error: e || "Incorrect course names, make sure to input an array of strings" };
    }
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return { user: await User.delete(user), profile: await Profile.delete(user), status: await Status.delete(user) };
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  @Router.get("/profiles")
  async getProfiles() {
    return Responses.profiles(await Profile.getProfiles());
  }

  @Router.get("/profiles/:username")
  async getProfile(username: string) {
    const user = await User.getUserByUsername(username);
    return Responses.profile(await Profile.getProfile(user._id));
  }

  @Router.patch("/profile")
  async updateProfile(session: WebSessionDoc, update: Partial<ProfileDoc>) {
    const user = WebSession.getUser(session);
    return await Profile.update(user, update);
  }

  @Router.get("/status/:username")
  async getStatus(username: string) {
    const user = await User.getUserByUsername(username);
    return await Status.getStatus(user._id);
  }

  @Router.patch("/status")
  async updateStatus(session: WebSessionDoc, update: Partial<StatusDoc>) {
    const user = WebSession.getUser(session);
    return await Status.update(user, update);
  }

  @Router.get("/statuses")
  async getFriendsSameAssignment(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    const friends = await Friend.getFriends(user);

    return Responses.friends(
      await Promise.all(
        friends.map(async (friend: ObjectId) => {
          return Status.isSameAssignment(user, friend);
        }),
      ).then((res) => friends.filter((friend, index) => res[index])),
    );
  }

  @Router.get("/messages")
  async getMessages(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return Responses.messages(await Message.getMessages(user));
  }

  @Router.get("/messages/:username")
  async getMessagesBetween(session: WebSessionDoc, username: string) {
    const u1 = WebSession.getUser(session);
    const u2 = (await User.getUserByUsername(username))._id;
    return Responses.messages(await Message.getMessagesBetween(u1, u2));
  }

  @Router.post("/messages/:to")
  async sendMessage(session: WebSessionDoc, to: string, content: string) {
    const u1 = WebSession.getUser(session);
    const u2 = (await User.getUserByUsername(to))._id;
    return (await Message.sendMessage(u1, u2, content)).msg;
  }
  @Router.get("/groups")
  async getGroups(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return Responses.groups(await Group.getGroups(user));
  }

  @Router.get("/groups/:groupName")
  async getGroupContent(session: WebSessionDoc, groupName?: string) {
    const user = WebSession.getUser(session);
    return Responses.groups(await Group.getGroups(user, groupName));
  }

  @Router.post("/groups")
  async createGroup(session: WebSessionDoc, name: string, members: Array<string>) {
    const user = WebSession.getUser(session);
    const membersId = await Promise.all(members.map(async (member) => (await User.getUserByUsername(member))._id));
    return Group.create(name, user, membersId);
  }

  @Router.patch("/group/join/:groupName")
  async joinGroup(session: WebSessionDoc, groupName: string) {
    const user = WebSession.getUser(session);
    return await Group.join(user, groupName);
  }

  @Router.patch("/group/leave/:groupName")
  async leaveGroup(session: WebSessionDoc, groupName: string) {
    const user = WebSession.getUser(session);
    const msg = await Group.leave(user, groupName);
    await GroupTask.deleteAll(user);
    return msg;
  }

  @Router.patch("/group/remove/:groupName")
  async removeGroupMember(session: WebSessionDoc, groupName: string, memberUsername: string) {
    const user = WebSession.getUser(session);
    const member = await User.getUserByUsername(memberUsername);
    const msg = await Group.removeMember(user, groupName, member._id);
    await GroupTask.deleteAll(member._id);
    return msg;
  }

  @Router.delete("/group/delete/:groupName")
  async deleteGroup(session: WebSessionDoc, groupName: string) {
    const user = WebSession.getUser(session);
    const msg = await Group.delete(user, groupName);
    await GroupTask.deleteAll();
    return msg;
  }

  @Router.post("/group/sendMsg/:groupName")
  async sendGroupMessage(session: WebSessionDoc, groupName: string, content: string) {
    const user = WebSession.getUser(session);
    const group = await Group.getGroupByName(groupName);
    await Group.isGroupMember(user, groupName);
    const message = await GroupMessage.sendMessage(user, group._id, content);
    await Group.addMessage(groupName, message.id);
    return message.msg;
  }

  @Router.get("/tasks")
  async getTasks(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return { personal: await Responses.tasks(await Task.getTasks(user)), group: await Responses.tasks(await GroupTask.getTasks(user)) };
  }

  @Router.post("/task/add")
  async addTask(session: WebSessionDoc, content: string) {
    const user = WebSession.getUser(session);
    return await Task.addTask(user, content);
  }

  @Router.post("/task/add/:groupName")
  async assignTask(session: WebSessionDoc, content: string, groupName: string, to: string) {
    console.log(content, groupName, to);
    const user = WebSession.getUser(session);
    const assigned = (await User.getUserByUsername(to))._id;
    const group = await Group.getGroupByName(groupName);
    await Group.isGroupMember(user, groupName);
    await Group.isGroupMember(assigned, groupName);
    return await GroupTask.addTask(assigned, content, group._id);
  }

  @Router.patch("/task/complete")
  async completeTask(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Task.completeTask(user, _id);
  }

  @Router.patch("/task/complete/:groupName")
  async completeGroupTask(session: WebSessionDoc, _id: ObjectId, groupName: string) {
    const user = WebSession.getUser(session);
    await Group.isGroupMember(user, groupName);
    return await GroupTask.completeTask(user, _id);
  }

  @Router.patch("/task/delete")
  async deleteTask(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    return await Task.deleteTask(user, _id);
  }

  @Router.patch("/task/delete/:groupName")
  async deleteGroupTask(session: WebSessionDoc, _id: ObjectId, groupName: string) {
    const user = WebSession.getUser(session);
    await Group.isGroupMember(user, groupName);
    return await GroupTask.deleteTask(user, _id);
  }

  @Router.get("/tasks/groups/:groupName")
  async viewTasksInGroup(session: WebSessionDoc, groupName: string) {
    const user = WebSession.getUser(session);
    const group = await Group.getGroupByName(groupName);
    await Group.isGroupMember(user, groupName);
    return Responses.tasks(await GroupTask.viewTasksInGroup(group._id));
  }

  // @Router.get("/matches")
  // async getMatches(session: WebSessionDoc) {}

  // @Router.post("/matches/find")
  // async requestMatch(session: WebSessionDoc, preferences: string) {}
}

export default getExpressRouter(new Routes());
