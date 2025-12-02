import Dexie, { Table } from "dexie";

export interface DEX_Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  threadId: string;
  created_at: Date;
  thought: string;
}

export interface DEX_Thread {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
}

class ChatDB extends Dexie {
  messages!: Table<DEX_Message, string>;
  threads!: Table<DEX_Thread, string>;

  constructor() {
    super("chatdb");

    this.version(1).stores({
      messages: "id, role, content, threadId, created_at",
      threads: "id, title, created_at, updated_at",
    });

    this.threads.hook("creating", (_key, obj) => {
      obj.created_at = new Date();
      obj.updated_at = new Date();
    });

    this.messages.hook("creating", (_key, obj) => {
      obj.created_at = new Date();
    });
  }

  async createThread(title: string) {
    const id = crypto.randomUUID();

    await this.threads.add({
      id,
      title,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return id
  }

  async getAllThreads() {
    return this.threads.reverse().sortBy("updated_at");
  }

  async createMessage(
    message: Pick<DEX_Message, "role" | "content" | "threadId" | "thought">
  ) {
    const messageId = crypto.randomUUID();

    await this.transaction("rw", [this.messages, this.threads], async () => {
      await this.messages.add({
        ...message,
        id: messageId,
        created_at: new Date(),
      });

      await this.threads.update(message.threadId, {
        updated_at: new Date(),
      });

    })

    return messageId
  }

  async getMessagesForThread(threadId: string) {
    return this.messages
      .where("threadId")
      .equals(threadId)
      .sortBy("created_at");
  }
}

export const db = new ChatDB();
