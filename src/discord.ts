export class DiscordManager {
  #root = "https://discord.com/api/v10";
  #token: string;
  constructor(token: string) {
    this.#token = token;
  }
  async get(url: string) {
    const r = await fetch(`${this.#root}${url}`, {
      headers: {
        Authorization: `Bot ${this.#token}`,
      },
    });
    return await r.json();
  }
  async post(url: string, body: unknown) {
    const r = await fetch(`${this.#root}${url}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bot ${this.#token}`,
        "Content-Type": "application/json",
      },
    });
    return await r.json();
  }
  async patch(url: string, body: unknown) {
    const r = await fetch(`${this.#root}${url}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bot ${this.#token}`,
        "Content-Type": "application/json",
      },
    });
    return await r.json();
  }
  async put(url: string, body: unknown, auditReason?: string) {
    const r = await fetch(`${this.#root}${url}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: auditReason
        ? {
            Authorization: `Bot ${this.#token}`,
            "Content-Type": "application/json",
            "X-Audit-Log-Reason": auditReason,
          }
        : {
            Authorization: `Bot ${this.#token}`,
            "Content-Type": "application/json",
          },
    });
    try {
      return await r.json();
    } catch (e) {
      return e;
    }
  }
  async delete(url: string, body: unknown, auditReason?: string) {
    const r = await fetch(`${this.#root}${url}`, {
      method: "DELETE",
      body: JSON.stringify(body),
      headers: auditReason
        ? {
            Authorization: `Bot ${this.#token}`,
            "Content-Type": "application/json",
            "X-Audit-Log-Reason": auditReason,
          }
        : {
            Authorization: `Bot ${this.#token}`,
            "Content-Type": "application/json",
          },
    });
    try {
      return await r.json();
    } catch (e) {
      return e;
    }
  }
}
