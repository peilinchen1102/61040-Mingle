import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface TaskDoc extends BaseDoc {
  assigned: ObjectId;
  todo: string;
  status: "incomplete" | "completed";
}

export interface GroupTaskDoc extends BaseDoc {
  assigned: ObjectId;
  todo: string;
  group: ObjectId;
  status: "incomplete" | "completed";
}

export default class TaskConcept {
  public readonly tasks = new DocCollection<TaskDoc>("tasks");

  async getTasks(user: ObjectId) {
    return await this.tasks.readMany({ assigned: user });
  }

  async addTask(user: ObjectId, content: string) {
    await this.tasks.createOne({ assigned: user, todo: content });
    return { msg: "Task successfully created!" };
  }

  async deleteTask(user: ObjectId, _id: ObjectId) {
    await this.tasks.deleteOne({ assigned: user, _id: _id });
    return { msg: "Task successfully deleted!" };
  }

  async completeTask(user: ObjectId, _id: ObjectId) {
    await this.tasks.updateOne({ assigned: user, _id: _id }, { status: "completed" });
    return { msg: "Task successfully completed!" };
  }
}
