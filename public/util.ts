type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input", name: "input", major: "input", year: "input", courses: "json" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  {
    name: "Get Friends",
    endpoint: "/api/friends/",
    method: "GET",
    fields: {},
  },
  {
    name: "Remove Friend",
    endpoint: "api/friends/:friend",
    method: "DELETE",
    fields: { friend: "input" },
  },
  {
    name: "Get Friend Requests",
    endpoint: "api/friend/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "Send Friend Request",
    endpoint: "api/friend/requests/:to",
    method: "POST",
    fields: { to: "input" },
  },
  {
    name: "Remove Friend Request",
    endpoint: "api/friend/requests/:to",
    method: "DELETE",
    fields: { to: "input" },
  },
  {
    name: "Accept Friend Request",
    endpoint: "api/friend/accept/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Reject Friend Request",
    endpoint: "api/friend/reject/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Get Profiles (empty for all)",
    endpoint: "/api/profiles/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Update Profile",
    endpoint: "/api/profile",
    method: "PATCH",
    fields: { update: { name: "input", major: "input", year: "input", courses: "json" } },
  },
  {
    name: "Get Suggested Profiles",
    endpoint: "/api/profile/suggestion",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Status",
    endpoint: "/api/status/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Update Status",
    endpoint: "/api/status",
    method: "PATCH",
    fields: { update: { userStatus: "input", curAssignment: "input" } },
  },
  {
    name: "Get Friends Working on Same Assignment",
    endpoint: "/api/statuses",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Messages",
    endpoint: "/api/messages",
    method: "GET",
    fields: {},
  },
  {
    name: "Get Conversation With",
    endpoint: "/api/messages/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Send Message To",
    endpoint: "/api/messages/:to",
    method: "POST",
    fields: { to: "input", content: "input" },
  },
  {
    name: "Get Groups and Messages (empty for all groups you are in)",
    endpoint: "/api/groups/:groupName",
    method: "GET",
    fields: { groupName: "input" },
  },
  {
    name: "Create Group",
    endpoint: "/api/groups",
    method: "POST",
    fields: { name: "input", members: "json" },
  },
  {
    name: "Join Groups",
    endpoint: "/api/group/join/:groupName",
    method: "PATCH",
    fields: { groupName: "input" },
  },
  {
    name: "Leave Group",
    endpoint: "/api/group/leave/:groupName",
    method: "PATCH",
    fields: { groupName: "input" },
  },
  {
    name: "Remove Member From Group",
    endpoint: "/api/group/remove/:groupName",
    method: "PATCH",
    fields: { groupName: "input", memberUsername: "input" },
  },
  {
    name: "Delete Group",
    endpoint: "/api/group/delete/:groupName",
    method: "DELETE",
    fields: { groupName: "input" },
  },
  {
    name: "Send Group Message",
    endpoint: "/api/group/sendMsg/:groupName",
    method: "POST",
    fields: { groupName: "input", content: "input" },
  },
  {
    name: "Get Tasks",
    endpoint: "/api/tasks",
    method: "GET",
    fields: {},
  },
  {
    name: "Assign Task",
    endpoint: "/api/task/add/:groupName",
    method: "POST",
    fields: { groupName: "input", to: "input", content: "input" },
  },
  {
    name: "Complete Task",
    endpoint: "/api/task/complete/:groupName",
    method: "PATCH",
    fields: { _id: "input", groupName: "input" },
  },
  {
    name: "Delete Task",
    endpoint: "/api/task/delete/:groupName",
    method: "PATCH",
    fields: { _id: "input", groupName: "input" },
  },
  {
    name: "View Tasks in Group",
    endpoint: "/api/tasks/groups/:groupName",
    method: "GET",
    fields: { groupName: "input" },
  },
  {
    name: "Find Matches",
    endpoint: "/api/matches",
    method: "GET",
    fields: {},
  },
  {
    name: "Update Match Preferences",
    endpoint: "/api/matches/preferences",
    method: "PATCH",
    fields: { update: { year: "input", class: "input", collaborationType: "input", groupSize: "input", hoursCommitted: "input", location: "input" } },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      const htmlTag = tag === "json" ? "textarea" : tag;
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${htmlTag} name="${prefix}${name}"></${htmlTag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const op = operations.find((op) => op.endpoint === $endpoint && op.method === $method);
  const pairs = Object.entries(reqData);
  for (const [key, val] of pairs) {
    if (val === "") {
      delete reqData[key];
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const type = key.split(".").reduce((obj, key) => obj[key], op?.fields as any);
    if (type === "json") {
      reqData[key] = JSON.parse(val as string);
    }
  }

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
