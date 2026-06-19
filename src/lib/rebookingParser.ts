// src/lib/rebookingParser.ts
//
// 管理画面「予約作り直し」フローの貼り付け自動入力パーサ。
// 下記フォーマットのテキストをフォーム初期値へ変換する純関数。
//
//   宿泊希望日：9/21　1泊
//   お名前：中橋佑太
//   フリガナ：ナカハシユウタ
//   電話番号：08042511880
//   郵便番号：615-0051
//   住所：京都府京都市右京区西院83
//   メールアドレス：ynakahashi@au.com
//   大人男性人数：5
//   大人女性人数：
//   子供寝具あり人数：
//   子供寝具なし人数：5
//   お食事（必要な場合〇〇人前とご記載ください）：
//   チェックイン予定時間：15:00
//   ご利用目的：ご旅行
//   LINEクーポン　1000円あり
//
// 棟数・性別・生年月日はテンプレに含まれないためここでは扱わない（フォームで手入力/既定値）。

export interface ParsedGuestCounts {
  num_male: number;
  num_female: number;
  num_child_with_bed: number;
  num_child_no_bed: number;
}

export interface ParsedRebooking {
  checkInDate: string | null; // YYYY-MM-DD
  nights: number | null;
  name: string | null;
  nameKana: string | null;
  phone: string | null;
  postalCode: string | null;
  prefecture: string | null;
  cityAddress: string | null;
  email: string | null;
  guestCounts: ParsedGuestCounts;
  checkInTime: string | null; // HH:MM
  purpose: string | null; // travel | anniversary | birthday_adult | birthday_minor | other
  mealNote: string | null; // 食事の自由記述（人前など）
  couponNote: string | null; // クーポンの自由記述
  warnings: string[]; // 解析できなかった/要確認の項目
}

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

/** 全角英数字・記号を半角へ正規化する。 */
function toHalfWidth(s: string): string {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/／/g, '/')
    .replace(/[：]/g, ':')
    .replace(/[－―ー]/g, '-');
}

/**
 * 自由記述のチェックイン時刻を PostgreSQL の time 型互換の "HH:MM" に正規化する。
 * 例: "15:00"→"15:00", "15時"→"15:00", "15時30分"→"15:30", "15時半"→"15:30", "15"→"15:00"
 * 解釈できない場合は null（呼び出し側で既定値にフォールバック）。
 */
export function normalizeCheckInTime(value: string | null | undefined): string | null {
  const s = (value ?? '').trim();
  if (!s) return null;
  const half = toHalfWidth(s);
  let h: number | null = null;
  let m = 0;
  let mm: RegExpMatchArray | null;
  if ((mm = half.match(/(\d{1,2}):(\d{2})/))) {
    h = +mm[1];
    m = +mm[2];
  } else if ((mm = half.match(/(\d{1,2})\s*時\s*(\d{1,2})\s*分/))) {
    h = +mm[1];
    m = +mm[2];
  } else if ((mm = half.match(/(\d{1,2})\s*時半/))) {
    h = +mm[1];
    m = 30;
  } else if ((mm = half.match(/(\d{1,2})\s*時/))) {
    h = +mm[1];
    m = 0;
  } else if ((mm = half.match(/^(\d{1,2})$/))) {
    h = +mm[1];
    m = 0;
  }
  if (h === null || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 値文字列から整数を抽出（空・非数値は 0）。 */
function parseCount(value: string): number {
  const half = toHalfWidth(value).replace(/[^0-9]/g, '');
  if (half === '') return 0;
  const n = parseInt(half, 10);
  return Number.isFinite(n) ? n : 0;
}

/** YYYY-MM-DD 文字列を生成。 */
function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** 「9/21」等から、referenceDate 以降で最も近い将来の YYYY-MM-DD を推定。 */
function inferDate(monthDay: string, referenceDate: Date): string | null {
  const half = toHalfWidth(monthDay);
  const m = half.match(/(\d{1,2})\s*[\/月]\s*(\d{1,2})/);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const refY = referenceDate.getFullYear();
  const candidate = new Date(refY, month - 1, day);
  const refDateOnly = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const year = candidate < refDateOnly ? refY + 1 : refY;
  return toISO(year, month, day);
}

/** ご利用目的の自由記述を内部値へマッピング。 */
function mapPurpose(value: string): string {
  if (value.includes('旅行')) return 'travel';
  if (value.includes('記念')) return 'anniversary';
  if (value.includes('誕生')) {
    if (value.includes('19') || value.includes('以下') || value.includes('子')) {
      return 'birthday_minor';
    }
    return 'birthday_adult';
  }
  return 'other';
}

/** ラベルと値を ':' / '：' で分割（最初の区切りのみ）。区切りが無ければ null。 */
function splitLabelValue(line: string): { label: string; value: string } | null {
  const idx = line.search(/[:：]/);
  if (idx < 0) return null;
  return {
    label: line.slice(0, idx).trim(),
    value: line.slice(idx + 1).trim(),
  };
}

/**
 * 貼り付けテキストを解析してフォーム初期値を返す。
 * @param text 貼り付けられた予約情報
 * @param referenceDate 年補完の基準日（テスト用に注入可能・既定は現在日時）
 */
export function parseRebookingText(
  text: string,
  referenceDate: Date = new Date()
): ParsedRebooking {
  const result: ParsedRebooking = {
    checkInDate: null,
    nights: null,
    name: null,
    nameKana: null,
    phone: null,
    postalCode: null,
    prefecture: null,
    cityAddress: null,
    email: null,
    guestCounts: { num_male: 0, num_female: 0, num_child_with_bed: 0, num_child_no_bed: 0 },
    checkInTime: null,
    purpose: null,
    mealNote: null,
    couponNote: null,
    warnings: [],
  };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== '');

  for (const rawLine of lines) {
    const line = rawLine.replace(/　/g, ' '); // 全角スペース→半角
    const pair = splitLabelValue(line);

    // 区切りの無い行（例: 「LINEクーポン 1000円あり」）
    if (!pair) {
      if (line.includes('クーポン')) {
        result.couponNote = result.couponNote
          ? `${result.couponNote} / ${line}`
          : line;
      }
      continue;
    }

    const { label, value } = pair;

    if (label.includes('宿泊') && (label.includes('日') || label.includes('希望'))) {
      result.checkInDate = inferDate(value, referenceDate);
      if (!result.checkInDate) result.warnings.push('宿泊希望日を解析できませんでした');
      const nightsMatch = toHalfWidth(value).match(/(\d+)\s*泊/);
      result.nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 1;
      continue;
    }
    if (label.includes('フリガナ') || label.includes('ふりがな') || label.includes('カナ')) {
      result.nameKana = value || null;
      continue;
    }
    if (label.includes('名前') || label === '氏名') {
      result.name = value || null;
      continue;
    }
    if (label.includes('電話')) {
      result.phone = value ? toHalfWidth(value).replace(/[^0-9]/g, '') : null;
      continue;
    }
    if (label.includes('郵便')) {
      result.postalCode = value ? toHalfWidth(value).trim() : null;
      continue;
    }
    if (label.includes('メール')) {
      result.email = value || null;
      continue;
    }
    if (label.includes('住所')) {
      const pref = PREFECTURES.find((p) => value.startsWith(p));
      if (pref) {
        result.prefecture = pref;
        result.cityAddress = value.slice(pref.length).trim();
      } else {
        result.cityAddress = value || null;
        if (value) result.warnings.push('住所から都道府県を判定できませんでした');
      }
      continue;
    }
    if (label.includes('大人') && label.includes('男')) {
      result.guestCounts.num_male = parseCount(value);
      continue;
    }
    if (label.includes('大人') && label.includes('女')) {
      result.guestCounts.num_female = parseCount(value);
      continue;
    }
    if (label.includes('子供') && label.includes('あり')) {
      result.guestCounts.num_child_with_bed = parseCount(value);
      continue;
    }
    if (label.includes('子供') && label.includes('なし')) {
      result.guestCounts.num_child_no_bed = parseCount(value);
      continue;
    }
    if (label.includes('食事')) {
      result.mealNote = value || null;
      continue;
    }
    if (label.includes('チェックイン')) {
      result.checkInTime = normalizeCheckInTime(value);
      continue;
    }
    if (label.includes('目的')) {
      result.purpose = value ? mapPurpose(value) : null;
      continue;
    }
    if (label.includes('クーポン')) {
      const note = value || line;
      result.couponNote = result.couponNote ? `${result.couponNote} / ${note}` : note;
      continue;
    }
  }

  return result;
}
