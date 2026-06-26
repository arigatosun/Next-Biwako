// ねっぱん自動化 FastAPI のベースURL。環境変数で差し替え可能（未設定時は現行のngrok URLにフォールバック）。
// ngrok無料版はURLが再起動で変わるため、固定ドメイン化したら NEPPAN_FASTAPI_BASE_URL を設定する。
const FASTAPI_BASE_URL =
  process.env.NEPPAN_FASTAPI_BASE_URL ?? 'https://14d4-34-97-99-223.ngrok-free.app';

export const FASTAPI_CREATE_RESERVATION_ENDPOINT = `${FASTAPI_BASE_URL}/create_reservation`;
