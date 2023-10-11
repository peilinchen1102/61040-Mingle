import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface TaskDoc extends BaseDoc {
  assigned: ObjectId;
  todo: string;
  status: "incomplete" | "completed";
}

export interface GroupTaskDoc extends TaskDoc {
  group: ObjectId;
}

export default class TaskConcept {
  public readonly tasks: DocCollection<TaskDoc> | DocCollection<GroupTaskDoc>;

  constructor(type: string) {
    if (type === "tasks") {
      this.tasks = new DocCollection<TaskDoc>(type);
    } else {
      this.tasks = new DocCollection<GroupTaskDoc>(type);
    }
  }

  async getTasks(user: ObjectId) {
    return await this.tasks.readMany({ assigned: user });
  }

  async viewTasksInGroup(group: ObjectId): Promise<GroupTaskDoc[] | TaskDoc[]> {
    return await this.tasks.readMany({ group: group });
  }

  async addTask(user: ObjectId, content: string, group?: ObjectId) {
    if (!group) {
      await this.tasks.createOne({ assigned: user, todo: content, status: "incomplete" });
    } else {
      await this.tasks.createOne({ assigned: user, todo: content, status: "incomplete", group: group });
    }

    return { msg: "Task successfully created!" };
  }

  async deleteTask(user: ObjectId, _id: ObjectId) {
    await this.isAssigned(user, _id);
    await this.tasks.deleteOne({ assigned: user, _id: _id });
    return { msg: "Task successfully deleted!" };
  }

  async deleteAll(user?: ObjectId) {
    const filter = user ? { assigned: user } : {};
    await this.tasks.deleteOne(filter);
    return { msg: "Task successfully deleted!" };
  }

  async completeTask(user: ObjectId, _id: ObjectId) {
    await this.isAssigned(user, _id);
    await this.tasks.updateOne({ assigned: user, _id: _id }, { status: "completed" });
    return { msg: "Task successfully completed!" };
  }

  async taskExist(_id: ObjectId) {
    const maybeTask = await this.tasks.readOne({ _id: _id });
    if (maybeTask == null) {
      throw new NotFoundError(`Task not found!`);
    }
  }

  async isAssigned(user: ObjectId, _id: ObjectId) {
    const task = await this.tasks.readOne({ _id: _id });
    if (!task) {
      throw new NotFoundError(`Task ${_id} does not exist!`);
    }

    if (task.assigned.toString() !== user.toString()) {
      throw new TaskAssignedNotMatchError(user, _id);
    }
  }
}

export class TaskAssignedNotMatchError extends NotAllowedError {
  constructor(
    public readonly user: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not assigned task {1}!", user, _id);
  }
}
