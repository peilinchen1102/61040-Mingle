import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface ProfileDoc extends BaseDoc {
  owner: ObjectId;
  name: string;
  major: string;
  year: number;
  courses: Array<string>;
}

export default class ProfileConcept {
  public readonly profiles = new DocCollection<ProfileDoc>("profiles");

  async create(owner: ObjectId, name: string, major: string, year: string, courses: string) {
    const yearNum = parseInt(year);
    const listCourses: Array<string> = JSON.parse("[" + courses + "]");
    const _id = await this.profiles.createOne({ owner, name, major, year: yearNum, courses: listCourses });
    return { msg: "Profile successfully created!", profile: await this.profiles.readOne({ _id }) };
  }

  async getProfiles(username?: string) {
    const filter = username ? { username } : {};
    const profiles = await this.profiles.readMany(filter);
    return profiles;
  }

  async getProfile(_id: ObjectId) {
    const profile = await this.profiles.readOne({ owner: _id });
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

  async delete(owner: ObjectId) {
    await this.profiles.deleteOne({ owner });
    return { msg: "Profile deleted!" };
  }

  async parseUpdate(profile: ProfileDoc, name?: string, major?: string, year?: string, courses?: string) {
    const yearNum = year ? parseInt(year) : profile.year;
    const listCourses: Array<string> = courses ? JSON.parse("[" + courses + "]") : profile.courses;
    return { name: name || profile.name, major: major || profile.major, year: yearNum, courses: listCourses };
  }

  private sanitizeUpdate(update: Partial<ProfileDoc>) {
    const allowedUpdates = ["name", "major", "year", "courses"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}
