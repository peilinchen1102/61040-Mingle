import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError } from "./errors";

export interface UserMatchDoc extends BaseDoc {
  owner: ObjectId;
  year: string;
  class: string;
  collaborationType: "research" | "discussion" | "programming" | "presentation" | "problem set";
  groupSize: "small" | "medium" | "large";
  hoursCommitted: string;
  location: "off-campus | on-campus" | string;
}

export default class UserMatchConcept {
  public readonly preferences = new DocCollection<UserMatchDoc>("preferences");

  async createPreferences(user: ObjectId) {
    await this.preferences.createOne({ owner: user, year: "", class: "", collaborationType: "problem set", groupSize: "medium", hoursCommitted: "5", location: "on-campus" });
    return { msg: "Preferences created succesfully!" };
  }

  async updatePreferences(user: ObjectId, update: Partial<UserMatchDoc>) {
    const preferences = await this.preferences.readOne({ owner: user });
    if (!preferences) {
      await this.createPreferences(user);
    }
    this.sanitizeUpdate(update);
    await this.preferences.updateOne({ owner: user }, update);
    return { msg: "Preferences successfully updated!" };
  }

  async getPreferences(user: ObjectId) {
    const preferences = await this.preferences.readOne({ owner: user });
    if (!preferences) {
      return;
    }
    return preferences;
  }

  async getMatches(user: ObjectId, others: ObjectId[]) {
    const pairs: Array<[ObjectId, number]> = await Promise.all(others.map(async (other) => [other, await this.getNumberInCommon(user, other)]));

    return pairs.filter((pair) => pair[1] > 0).sort((pair) => -pair[1]);
  }

  async getNumberInCommon(u1: ObjectId, u2: ObjectId) {
    const p1 = await this.getPreferences(u1);
    const p2 = await this.getPreferences(u2);
    let common = 0;

    if (p1 !== undefined && p2 !== undefined && u1.toString() !== u2.toString()) {
      let key: keyof typeof p1;
      for (key in p1) {
        if (p1[key] == p2[key]) {
          common += 1;
        }
      }
    }
    return common;
  }

  async delete(user: ObjectId) {
    await this.preferences.deleteOne({ owner: user });
    return { msg: "Preferences successfully deleted!" };
  }
  private sanitizeUpdate(update: Partial<UserMatchDoc>) {
    let key: keyof typeof update;
    for (key in update) {
      if (key.toString() === "collaborationType" && !["research", "discussion", "programming", "presentation", "problem set"].includes(update[key] as string)) {
        throw new NotAllowedError(`Collaboration style can only be "research", "discussion", "programming", "presentation", or "problem set"`);
      } else if (key.toString() === "groupSize" && !["small", "medium", "large"].includes(update[key] as string)) {
        throw new NotAllowedError(`GroupSize can only be "small", "medium", or "large"`);
      } else if (key.toString() === "hoursCommitted") {
        const num = update[key] as string;
        if (!(num.match(/^-?\d+$/) || num.match(/^\d+\.\d+$/))) {
          //valid integer (positive or negative)
          throw new NotAllowedError(`Hours committed must be numbers!`);
        }
      } else if (key.toString() === "owner") {
        throw new NotAllowedError(`Cannot update owner field!`);
      }
    }
  }
}
