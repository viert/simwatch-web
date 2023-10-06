import Axios from "axios";
import type {
  APIConnectEvent,
  APIConnectHandler,
  MapBoundsEx,
  Pilot,
} from "./types";

type UpdateRequest = Record<string, any> & { request_type: string };

class APIConnect {
  private handlers: Record<APIConnectEvent, APIConnectHandler[]>;
  private ws: WebSocket | null = null;
  private _connected = false;
  private spool: UpdateRequest[];

  private _onerr: () => void;
  private _onmsg: () => void;
  private _onopen: () => void;
  private _onclose: () => void;

  constructor() {
    this._onerr = this.onError.bind(this);
    this._onmsg = this.onMessage.bind(this);
    this._onopen = this.onOpen.bind(this);
    this._onclose = this.onClose.bind(this);

    this.handlers = {
      close: [],
      connect: [],
      error: [],
      "set-pilots": [],
      "del-pilots": [],
      "set-airports": [],
      "del-airports": [],
      "set-firs": [],
      "del-firs": [],
    };

    this.spool = [];
    this._reconnect();
  }

  on(evName: APIConnectEvent, handler: APIConnectHandler) {
    if (evName in this.handlers) {
      this.handlers[evName].push(handler);
    }
  }

  off(evName: APIConnectEvent, handler: APIConnectHandler) {
    if (evName in this.handlers) {
      const idx = this.handlers[evName].indexOf(handler);
      if (idx >= 0) {
        this.handlers[evName].splice(idx, 1);
      }
    }
  }

  send(data: UpdateRequest) {
    this.spool.push(data);
    this.dispatch();
  }

  dispatch() {
    if (this.ws && this._connected) {
      this.spool.forEach(req => this.ws.send(JSON.stringify(req)));
      this.spool = [];
    }
  }

  setBounds(bounds: MapBoundsEx) {
    const req = {
      request_type: "map_bounds",
      sw: bounds.min,
      ne: bounds.max,
      zoom: bounds.zoom,
    };
    this.send(req);
  }

  setWeather(value: boolean) {
    const req = {
      request_type: "wx",
      show_wx: value,
    };
    this.send(req);
  }

  async setFilter(query: string): Promise<boolean> {
    const checkResult = await this.checkQuery(query);
    if (checkResult) {
      const req = {
        request_type: "filter",
        filter: query,
      };
      this.send(req);
    }
    return checkResult;
  }

  resetFilter() {
    const req = {
      request_type: "filter",
      filter: "",
    };
    this.send(req);
  }

  subscribeID(id: string) {
    const req = {
      request_type: "subscribe_id",
      subscribe_id: id,
    };
    this.send(req);
  }

  unsubscribeID(id: string) {
    const req = {
      request_type: "unsubscribe_id",
      unsubscribe_id: id,
    };
    this.send(req);
  }

  async getPilot(callsign: string): Promise<Pilot> {
    return await Axios.get<Pilot, any>(`/api/v1/pilots/${callsign}`).then(
      resp => resp.data
    );
  }

  private async checkQuery(query: string): Promise<boolean> {
    query = encodeURIComponent(query);
    return await Axios.get(`/api/v1/simwatch/checkquery?query=${query}`)
      .then(({ data }) => {
        if (data.error) {
          this.emit("error", data.error);
        }
        return data.valid;
      })
      .catch(err => {
        const message =
          err.response?.data?.error || "unidentified error in query";
        this.emit("error", message);
        return false;
      });
  }

  private emit(evName: APIConnectEvent, ...args: any[]) {
    this.handlers[evName].forEach(handler => {
      handler.apply(null, args);
    });
  }

  private onOpen() {
    this.emit("connect");
    this._connected = true;
    this.dispatch();
  }

  private onError(e: ErrorEvent) {
    const message = e.error || e.message || "WebSocket unidentified error";
    this.emit("error", message);
    this._connected = false;
    // in either case let's try to reconnect
    setTimeout(() => {
      this._reconnect();
    }, 3000);
  }

  private onMessage(msg: MessageEvent) {
    let msgData;

    try {
      msgData = JSON.parse(msg.data);
    } catch (e) {
      console.log("error parsing message data:", e);
      return;
    }

    if (msgData.error) {
      this.ws.close();
      this.onError(msgData);
      return;
    }

    if (msgData.pilot_update) {
      switch (msgData.pilot_update.update_type) {
        case "SET":
          this.emit("set-pilots", msgData.pilot_update.pilots);
          break;
        case "DELETE":
          this.emit("del-pilots", msgData.pilot_update.pilots);
          break;
      }
    } else if (msgData.airport_update) {
      switch (msgData.airport_update.update_type) {
        case "SET":
          this.emit("set-airports", msgData.airport_update.airports);
          break;
        case "DELETE":
          this.emit("del-airports", msgData.airport_update.airports);
          break;
      }
    } else if (msgData.fir_update) {
      switch (msgData.fir_update.update_type) {
        case "SET":
          this.emit("set-firs", msgData.fir_update.firs);
          break;
        case "DELETE":
          this.emit("del-firs", msgData.fir_update.firs);
          break;
      }
    }
  }

  private onClose() {
    this.emit("close");
    this._connected = false;
    setTimeout(() => {
      this._reconnect();
    }, 3000);
  }

  private _reconnect() {
    if (this.ws !== null) {
      this._connected = false;
      this.ws.removeEventListener("open", this._onopen);
      this.ws.removeEventListener("close", this._onclose);
      this.ws.removeEventListener("error", this._onerr);
      this.ws.removeEventListener("message", this._onmsg);
      this.ws.close();
    }

    const schema = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    this.ws = new WebSocket(`${schema}://${host}/api/v1/simwatch/`);
    this.ws.addEventListener("open", this._onopen);
    this.ws.addEventListener("close", this._onclose);
    this.ws.addEventListener("error", this._onerr);
    this.ws.addEventListener("message", this._onmsg);
    this.dispatch();
  }
}

export const api = new APIConnect();
window["api"] = api;
