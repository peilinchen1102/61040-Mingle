import { ObjectId } from "mongodb";
import { Group, GroupMessage, User } from "./app";
import { AlreadyFriendsError, FriendNotFoundError, FriendRequestAlreadyExistsError, FriendRequestDoc, FriendRequestNotFoundError } from "./concepts/friend";
import { GroupDoc } from "./concepts/group";
import { MessageDoc } from "./concepts/message";
import { PostAuthorNotMatchError, PostDoc } from "./concepts/post";
import { ProfileDoc } from "./concepts/profile";
import { Router } from "./framework/router";

/**
 * This class does useful conversions for the frontend.
 * For example, it converts a {@link PostDoc} into a more readable format for the frontend.
 */
export default class Responses {
  /**
   * Convert PostDoc into more readable format for the frontend by converting the author id into a username.
   */
  static async post(post: PostDoc | null) {
    if (!post) {
      return post;
    }
    const author = await User.getUserById(post.author);
    return { ...post, author: author.username };
  }

  /**
   * Same as {@link post} but for an array of PostDoc for improved performance.
   */
  static async posts(posts: PostDoc[]) {
    const authors = await User.idsToUsernames(posts.map((post) => post.author));
    return posts.map((post, i) => ({ ...post, author: authors[i] }));
  }

  /**
   * Convert FriendRequestDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friendRequests(requests: FriendRequestDoc[]) {
    const from = requests.map((request) => request.from);
    const to = requests.map((request) => request.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return requests.map((request, i) => ({ ...request, from: usernames[i], to: usernames[i + requests.length] }));
  }

  /**
   * Convert FriendDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async friends(friends: ObjectId[]) {
    const usernames = await User.idsToUsernames(friends);
    return usernames;
  }

  /**
   * Convert ProfileDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async profile(profile: ProfileDoc) {
    const username = await User.idsToUsernames([profile.owner]);
    return { ...profile, owner: username[0] };
  }

  /**
   * Same as {@link profile} but for an array of Profile for improved performance.
   */
  static async profiles(profiles: ProfileDoc[]) {
    const usernames = await User.idsToUsernames(profiles.map((profile) => profile.owner));
    return profiles.map((profile, i) => ({ ...profile, owner: usernames[i] }));
  }

  /**
   * Convert GroupDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async groups(groups: GroupDoc[]) {
    if (!groups) {
      return groups;
    }
    const usernames = await User.idsToUsernames(groups.map((group) => group.owner));
    const members = await Promise.all(groups.map(async (group) => await User.idsToUsernames(group.members)));
    const messages = await Promise.all(groups.map(async (group) => await this.groupMessages(await GroupMessage.getMessagesByIds(group.messages))));
    return groups.map((group, i) => ({ ...group, owner: usernames[i], members: members[i], messages: { ...messages } }));
  }

  /**
   * Convert MessageDoc into more readable format for the frontend
   * by converting the ids into usernames.
   */
  static async messages(messages: MessageDoc[]) {
    const from = messages.map((msg) => msg.from);
    const to = messages.map((msg) => msg.to);
    const usernames = await User.idsToUsernames(from.concat(to));
    return messages.map((msg, i) => ({ ...msg, from: usernames[i], to: usernames[i + messages.length] }));
  }

  /**
   * Convert MessageDoc into more readable format for the frontend
   * by converting the user ids into usernames and group ids to group names.
   */
  static async groupMessages(messages: MessageDoc[]) {
    const from = messages.map((msg) => msg.from);
    const to = messages.map((msg) => msg.to);
    const usernames = await User.idsToUsernames(from);
    const groupNames = await Group.getGroupNameByIds(to);
    return messages.map((msg, i) => ({ ...msg, from: usernames[i], to: groupNames[i] }));
  }
}

Router.registerError(PostAuthorNotMatchError, async (e) => {
  const username = (await User.getUserById(e.author)).username;
  return e.formatWith(username, e._id);
});

Router.registerError(FriendRequestAlreadyExistsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(FriendRequestNotFoundError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.from), User.getUserById(e.to)]);
  return e.formatWith(user1.username, user2.username);
});

Router.registerError(AlreadyFriendsError, async (e) => {
  const [user1, user2] = await Promise.all([User.getUserById(e.user1), User.getUserById(e.user2)]);
  return e.formatWith(user1.username, user2.username);
});
