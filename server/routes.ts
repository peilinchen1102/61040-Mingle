import { ObjectId } from "mongodb";
import { Friend, Message, Post, Profile, Status, User, WebSession } from "./app";
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
  async createUser(session: WebSessionDoc, username: string, password: string, name: string, major: string, year: number, courses: Array<string>) {
    WebSession.isLoggedOut(session);
    const user = await User.create(username, password);
    const userInfo = await User.getUserByUsername(username);
    const profile = await Profile.create(userInfo._id, name, major, year, courses);
    const status = await Status.create(userInfo._id);
    return { msg: "User, Profile, Status successfully created!", user: user.user, profile: profile.profile, status: status.status };
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
    return { user: await User.delete(user), profile: await Profile.delete(user) };
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
    const u2 = await User.getUserByUsername(username);
    return Responses.messages(await Message.getMessagesBetween(u1, u2._id));
  }

  @Router.post("/messages/:to")
  async sendMessage(session: WebSessionDoc, to: string, content: string) {
    const u1 = WebSession.getUser(session);
    const u2 = await User.getUserByUsername(to);
    return await Message.sendMessage(u1, u2._id, content);
  }

  // @Router.get("/groups")
  // async getGroups(session: WebSessionDoc) {}

  // @Router.post("/groups")
  // async createGroup(session: WebSessionDoc, name: string) {}

  // @Router.delete("/groups/:group")
  // async leaveGroup(session: WebSessionDoc, group: string) {}

  // @Router.post("/group/requests/:to")
  // async sendGroupRequest(session: WebSessionDoc, to: string) {}

  // @Router.put("group/accept/:from")
  // async acceptGroupRequest(session: WebSessionDoc, from: string) {}

  // @Router.put("group/reject/:from")
  // async rejectGroupRequest(session: WebSessionDoc, from: string) {}

  // @Router.get("/tasks")
  // async getTasks(session: WebSessionDoc) {}

  // @Router.post("/tasks/add/:group")
  // async addTask(session: WebSessionDoc, group?: string) {}

  // @Router.put("/tasks/complete/:group")
  // async completeTask(session: WebSessionDoc, group?: string) {}

  // @Router.get("/tasks/group/:group")
  // async getGroupTasks(session: WebSessionDoc, group?: string) {}

  // @Router.get("/matches")
  // async getMatches(session: WebSessionDoc) {}

  // @Router.post("/matches/find")
  // async requestMatch(session: WebSessionDoc, preferences: string) {}
}

export default getExpressRouter(new Routes());
