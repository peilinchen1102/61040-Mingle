import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotFoundError } from "./errors";

export interface TaskDoc extends BaseDoc {
  assigned: ObjectId;
  todo: string;
  status: "incomplete" | "completed";
}

export default class TaskConcept {
  public readonly tasks: DocCollection<TaskDoc>;

  constructor(type: string) {
    this.tasks = new DocCollection<TaskDoc>(type);
  }

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

  async taskExist(_id: ObjectId) {
    const maybeTask = await this.tasks.readOne({ _id: _id });
    if (maybeTask == null) {
      throw new NotFoundError(`Task not found!`);
    }
  }
}
