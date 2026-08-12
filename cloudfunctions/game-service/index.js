const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const saves = db.collection("player_saves");
const events = db.collection("analytics_events");

const success = (data) => ({ ok: true, data });
const failure = (message, extra = {}) => ({ ok: false, message, ...extra });

const readSave = async (playerId) => {
  try {
    const result = await saves.doc(playerId).get();
    return result.data?.envelope ?? null;
  } catch (error) {
    if (error?.errCode === -1 || /does not exist/i.test(error?.message ?? "")) return null;
    throw error;
  }
};

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return failure("missing player identity");

  switch (event?.action) {
    case "now":
      return success(Date.now());
    case "login":
      return success({ playerId: OPENID });
    case "load":
      return success(await readSave(OPENID));
    case "save": {
      const incoming = event.envelope;
      if (incoming?.schemaVersion !== 5 || typeof incoming?.revision !== "number" || !incoming?.state) {
        return failure("invalid save envelope");
      }
      if (JSON.stringify(incoming.state).length > 512 * 1024) return failure("save payload too large");

      const current = await readSave(OPENID);
      const idempotent = current
        && incoming.revision === current.revision
        && incoming.deviceId === current.deviceId
        && incoming.updatedAt === current.updatedAt;
      if (current && incoming.revision <= current.revision && !idempotent) {
        return failure("save conflict", { conflict: true, data: current });
      }

      const envelope = { ...incoming, playerId: OPENID };
      await saves.doc(OPENID).set({ data: { envelope, serverReceivedAt: Date.now() } });
      return success(envelope);
    }
    case "analytics": {
      const analyticsEvent = event.event;
      if (!analyticsEvent?.name || JSON.stringify(analyticsEvent).length > 32 * 1024) {
        return failure("invalid analytics event");
      }
      await events.add({ data: { ...analyticsEvent, playerId: OPENID, serverReceivedAt: Date.now() } });
      return success(null);
    }
    default:
      return failure("unknown action");
  }
};
