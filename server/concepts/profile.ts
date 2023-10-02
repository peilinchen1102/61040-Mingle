import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ProfileDoc extends BaseDoc {
  owner: ObjectId;
  username: string;
  major: string;
  year: number;
  courses: Array<String>;
}

export default class ProfileConcept {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");

  async create(owner: ObjectId, username: string, major: string, year: string, courses: string) {
    const yearNum = parseInt(year);
    const listCourses: Array<string> = courses.split(", ");
    const _id = await this.profiles.createOne({ owner, username, major, year: yearNum, courses: listCourses });
    return { msg: "Profile successfully created!", profile: await this.profiles.readOne({ _id }) };
  }

  async getProfilesByUsername(username: string) {
    const profile = await this.profiles.readOne({ username: username });
    if (profile == null) {
      throw new NotFoundError(`Profile not found!`);
    }
    return profile;
  }

  async update(owner: ObjectId, update: Partial<ProfileDoc>) {
    this.sanitizeUpdate(update);
    await this.profiles.updateOne({ owner }, update);
    return { msg: "Profile successfully update!" };
  }

  private sanitizeUpdate(update: Partial<ProfileDoc>) {
    const allowedUpdates = ["major", "year", "courses"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class ProfileOwnerNotMatchError extends NotAllowedError {
  constructor(
    public readonly owner: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the owner of profile {1}!", owner, _id);
  }
}
