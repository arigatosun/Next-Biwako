import { describe, it, expect } from 'vitest';
import { parseRebookingText, normalizeCheckInTime } from './rebookingParser';

const SAMPLE = `宿泊希望日：9/21　1泊
お名前：中橋佑太
フリガナ：ナカハシユウタ
電話番号：08042511880
郵便番号：615-0051
住所：京都府京都市右京区西院83
メールアドレス：ynakahashi@au.com
大人男性人数：5
大人女性人数：
子供寝具あり人数：
子供寝具なし人数：5
お食事（必要な場合〇〇人前とご記載ください）：
チェックイン予定時間：15:00
ご利用目的：ご旅行
LINEクーポン　1000円あり`;

const REF = new Date(2026, 5, 17); // 2026-06-17

describe('parseRebookingText（サンプル全項目）', () => {
  const r = parseRebookingText(SAMPLE, REF);

  it('宿泊希望日を当年以降の最も近い将来として補完する', () => {
    expect(r.checkInDate).toBe('2026-09-21');
  });
  it('泊数を抽出する', () => {
    expect(r.nights).toBe(1);
  });
  it('氏名とフリガナを取り違えない', () => {
    expect(r.name).toBe('中橋佑太');
    expect(r.nameKana).toBe('ナカハシユウタ');
  });
  it('電話番号を数字のみで取得する', () => {
    expect(r.phone).toBe('08042511880');
  });
  it('郵便番号を取得する', () => {
    expect(r.postalCode).toBe('615-0051');
  });
  it('住所を都道府県と市区町村以下に分割する', () => {
    expect(r.prefecture).toBe('京都府');
    expect(r.cityAddress).toBe('京都市右京区西院83');
  });
  it('メールアドレスを取得する', () => {
    expect(r.email).toBe('ynakahashi@au.com');
  });
  it('人数の空欄は0、記載は数値で取得する', () => {
    expect(r.guestCounts).toEqual({
      num_male: 5,
      num_female: 0,
      num_child_with_bed: 0,
      num_child_no_bed: 5,
    });
  });
  it('チェックイン時間を取得する', () => {
    expect(r.checkInTime).toBe('15:00');
  });
  it('利用目的を内部値へマッピングする', () => {
    expect(r.purpose).toBe('travel');
  });
  it('クーポンの自由記述を保持する', () => {
    expect(r.couponNote).toContain('1000円');
  });
  it('全項目解析できた場合 warnings は空', () => {
    expect(r.warnings).toEqual([]);
  });
});

describe('parseRebookingText（境界・異常系）', () => {
  it('当年の日付が過去なら翌年に繰り越す', () => {
    const r = parseRebookingText('宿泊希望日：1/5 2泊', new Date(2026, 11, 1)); // 2026-12-01
    expect(r.checkInDate).toBe('2027-01-05');
    expect(r.nights).toBe(2);
  });

  it('泊数の記載が無ければ1泊とみなす', () => {
    const r = parseRebookingText('宿泊希望日：8/3', REF);
    expect(r.checkInDate).toBe('2026-08-03');
    expect(r.nights).toBe(1);
  });

  it('全角数字の日付・人数も解釈する', () => {
    const r = parseRebookingText('宿泊希望日：９/２１　１泊\n大人男性人数：３', REF);
    expect(r.checkInDate).toBe('2026-09-21');
    expect(r.guestCounts.num_male).toBe(3);
  });

  it('都道府県を判定できない住所は警告を出す', () => {
    const r = parseRebookingText('住所：西院83番地', REF);
    expect(r.prefecture).toBeNull();
    expect(r.cityAddress).toBe('西院83番地');
    expect(r.warnings).toContain('住所から都道府県を判定できませんでした');
  });

  it('目的のマッピング（記念日・誕生日・その他）', () => {
    expect(parseRebookingText('ご利用目的：記念日', REF).purpose).toBe('anniversary');
    expect(parseRebookingText('ご利用目的：お誕生日(20歳以上)', REF).purpose).toBe('birthday_adult');
    expect(parseRebookingText('ご利用目的：お誕生日(19歳以下)', REF).purpose).toBe('birthday_minor');
    expect(parseRebookingText('ご利用目的：出張', REF).purpose).toBe('other');
  });

  it('空文字入力でも例外なく既定値を返す', () => {
    const r = parseRebookingText('', REF);
    expect(r.checkInDate).toBeNull();
    expect(r.guestCounts.num_male).toBe(0);
  });

  it('チェックイン時刻「15時」表記も HH:MM に正規化する', () => {
    const r = parseRebookingText('チェックイン予定時間：15時', REF);
    expect(r.checkInTime).toBe('15:00');
  });
});

describe('normalizeCheckInTime', () => {
  it('HH:MM はそのまま', () => {
    expect(normalizeCheckInTime('15:00')).toBe('15:00');
    expect(normalizeCheckInTime('9:05')).toBe('09:05');
  });
  it('「15時」→「15:00」', () => {
    expect(normalizeCheckInTime('15時')).toBe('15:00');
  });
  it('「15時30分」→「15:30」', () => {
    expect(normalizeCheckInTime('15時30分')).toBe('15:30');
  });
  it('「15時半」→「15:30」', () => {
    expect(normalizeCheckInTime('15時半')).toBe('15:30');
  });
  it('数字のみ「15」→「15:00」', () => {
    expect(normalizeCheckInTime('15')).toBe('15:00');
  });
  it('全角「１５時」→「15:00」', () => {
    expect(normalizeCheckInTime('１５時')).toBe('15:00');
  });
  it('空・解釈不能は null', () => {
    expect(normalizeCheckInTime('')).toBeNull();
    expect(normalizeCheckInTime(null)).toBeNull();
    expect(normalizeCheckInTime('夕方')).toBeNull();
  });
  it('範囲外の時刻は null', () => {
    expect(normalizeCheckInTime('25:00')).toBeNull();
    expect(normalizeCheckInTime('15時70分')).toBeNull();
  });
});
