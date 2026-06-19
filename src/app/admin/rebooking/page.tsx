"use client";

// 管理画面：ねっぱん予約の本サイト「作り直し」ページ。
//  1. テキスト貼り付け → 自動入力（parseRebookingText）
//  2. キャンセル対象（既存ねっぱん由来）予約を検索して選択
//  3. 料金自動計算（computeReservationAmounts）＋クーポン適用
//  4. 確定 → /api/admin/rebooking（旧キャンセル＋新作成＋メール＋監査ログを1トランザクション）

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/app/contexts/AdminAuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { parseRebookingText } from "@/lib/rebookingParser";
import { computeReservationAmounts, addDaysISO, type MealSelectionInput } from "@/lib/pricing";
import { normalizePhoneNumber } from "@/lib/phoneNumber";
import { foodPlans } from "@/app/data/foodPlans";

interface SearchResult {
  id: number;
  reservation_number: string;
  name: string;
  name_kana: string | null;
  email: string;
  phone_number: string | null;
  check_in_date: string;
  num_nights: number;
  num_units: number;
  reservation_status: string;
  total_amount: number | null;
  neppan_reservation_id: string | number | null;
}

interface FormState {
  name: string;
  name_kana: string;
  email: string;
  phone_number: string;
  postal_code: string;
  prefecture: string;
  city_address: string;
  check_in_date: string;
  num_nights: number;
  num_units: number;
  num_male: number;
  num_female: number;
  num_child_with_bed: number;
  num_child_no_bed: number;
  estimated_check_in_time: string;
  purpose: string;
  special_requests: string;
  mealPlanId: string;
  mealCount: number;
  couponCode: string;
  roomTotalOverride: string; // 空文字=自動計算
}

const EMPTY_FORM: FormState = {
  name: "",
  name_kana: "",
  email: "",
  phone_number: "",
  postal_code: "",
  prefecture: "",
  city_address: "",
  check_in_date: "",
  num_nights: 1,
  num_units: 1,
  num_male: 0,
  num_female: 0,
  num_child_with_bed: 0,
  num_child_no_bed: 0,
  estimated_check_in_time: "15:00",
  purpose: "travel",
  special_requests: "",
  mealPlanId: "no-meal",
  mealCount: 0,
  couponCode: "",
  roomTotalOverride: "",
};

/** 氏名末尾の敬称「様」（前後空白込み）を取り除く。中間の「様」は対象外。 */
const stripTrailingSama = (name: string): string => name.replace(/\s*様\s*$/, "").trimEnd();

const COUPON_PRESETS: { code: string; label: string }[] = [
  { code: "COUPONNEST", label: "COUPONNEST（1,000円引き）" },
  { code: "REVIEWCOUPON1SOU1V8C", label: "REVIEWCOUPON1SOU1V8C（5,000円引き）" },
];

const PURPOSE_OPTIONS: { value: string; label: string }[] = [
  { value: "travel", label: "ご旅行" },
  { value: "anniversary", label: "記念日" },
  { value: "birthday_adult", label: "お誕生日(20歳以上)" },
  { value: "birthday_minor", label: "お誕生日(19歳以下)" },
  { value: "other", label: "その他" },
];

export default function RebookingPage() {
  const { adminUser, adminLoading } = useAdminAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [pasteText, setPasteText] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [coupon, setCoupon] = useState<{ discount_rate: number | null; discount_amount: number | null } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string>("");
  const [couponSelect, setCouponSelect] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewGuestHtml, setPreviewGuestHtml] = useState("");
  const [previewAdminHtml, setPreviewAdminHtml] = useState("");
  const [previewTab, setPreviewTab] = useState<"guest" | "admin">("guest");
  const [sendToNeppan, setSendToNeppan] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [conflicts, setConflicts] = useState<SearchResult[]>([]);
  const [conflictOcc, setConflictOcc] = useState<Record<string, number>>({});

  // --- 認証ガード（admin-dashboard と同様） ---
  useEffect(() => {
    if (!adminLoading) {
      const role = (adminUser?.app_metadata as { role?: string } | undefined)?.role;
      if (!adminUser || role !== "admin") {
        router.push("/auth/login");
      }
    }
  }, [adminUser, adminLoading, router]);

  const mealSelections: MealSelectionInput[] = useMemo(() => {
    if (form.mealPlanId && form.mealPlanId !== "no-meal" && form.mealCount > 0) {
      return [{ planId: form.mealPlanId, count: form.mealCount }];
    }
    return [];
  }, [form.mealPlanId, form.mealCount]);

  // --- 料金プレビュー（クライアント側・サーバが最終確定） ---
  const preview = useMemo(() => {
    if (!form.check_in_date) return null;
    const override = form.roomTotalOverride.trim() === "" ? null : Number(form.roomTotalOverride);
    return computeReservationAmounts({
      checkInDate: form.check_in_date,
      nights: form.num_nights,
      units: form.num_units,
      mealSelections,
      coupon,
      roomTotalOverride: Number.isFinite(override as number) ? override : null,
    });
  }, [form.check_in_date, form.num_nights, form.num_units, form.roomTotalOverride, mealSelections, coupon]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleParse = () => {
    const parsed = parseRebookingText(pasteText);
    setForm((prev) => ({
      ...prev,
      name: parsed.name ?? prev.name,
      name_kana: parsed.nameKana ?? prev.name_kana,
      email: parsed.email ?? prev.email,
      phone_number: parsed.phone ? normalizePhoneNumber(parsed.phone) : prev.phone_number,
      postal_code: parsed.postalCode ?? prev.postal_code,
      prefecture: parsed.prefecture ?? prev.prefecture,
      city_address: parsed.cityAddress ?? prev.city_address,
      check_in_date: parsed.checkInDate ?? prev.check_in_date,
      num_nights: parsed.nights ?? prev.num_nights,
      num_male: parsed.guestCounts.num_male,
      num_female: parsed.guestCounts.num_female,
      num_child_with_bed: parsed.guestCounts.num_child_with_bed,
      num_child_no_bed: parsed.guestCounts.num_child_no_bed,
      estimated_check_in_time: parsed.checkInTime ?? prev.estimated_check_in_time,
      purpose: parsed.purpose ?? prev.purpose,
    }));
    // 検索条件も自動補完
    if (parsed.name) setSearchName(parsed.name);
    if (parsed.phone) setSearchPhone(parsed.phone);
    if (parsed.checkInDate) setSearchDate(parsed.checkInDate);
    const warn = parsed.warnings.length ? `（要確認: ${parsed.warnings.join(" / ")}）` : "";
    toast({ title: "解析しました", description: `フォームに反映しました ${warn}` });
  };

  const getToken = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const handleSearch = async () => {
    if (!searchName && !searchPhone && !searchDate) {
      toast({ title: "条件を入力してください", description: "氏名・電話・宿泊日のいずれか", variant: "destructive" });
      return;
    }
    setSearching(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (searchName) params.set("name", searchName);
      if (searchPhone) params.set("phone", searchPhone);
      if (searchDate) params.set("checkInDate", searchDate);
      const res = await fetch(`/api/admin/reservations/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "検索に失敗しました");
      setSearchResults(json.reservations);
      // 自動選択：正規化氏名が一致するもの、無ければ結果が1件のときのみ
      const normName = (s: string) => (s || "").toLowerCase().replace(/[\s　様]/g, "");
      const auto =
        json.reservations.find(
          (r: SearchResult) => form.name && normName(r.name).includes(normName(form.name))
        ) ?? (json.reservations.length === 1 ? json.reservations[0] : null);
      if (auto) setTargetId(auto.id);
      if (json.reservations.length === 0) {
        toast({ title: "該当なし", description: "条件に合う予約が見つかりませんでした" });
      }
    } catch (e) {
      toast({ title: "エラー", description: e instanceof Error ? e.message : "検索失敗", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const applyCouponCode = async (code: string) => {
    if (!code) {
      setCoupon(null);
      setCouponMsg("");
      return;
    }
    const { data, error } = await supabase
      .from("coupons")
      .select("discount_rate, discount_amount, is_used, is_reusable")
      .eq("coupon_code", code)
      .single();
    if (error || !data) {
      setCoupon(null);
      setCouponMsg("クーポンが見つかりません");
      return;
    }
    if (data.is_used && !data.is_reusable) {
      setCoupon(null);
      setCouponMsg("このクーポンは使用済みです");
      return;
    }
    setCoupon({ discount_rate: data.discount_rate, discount_amount: data.discount_amount });
    setCouponMsg(`適用中${data.is_reusable ? "（使い回し可）" : ""}`);
  };

  const handleApplyCoupon = () => applyCouponCode(form.couponCode);

  // クーポンのプリセット選択
  const handleCouponSelect = (value: string) => {
    setCouponSelect(value);
    if (value === "") {
      set("couponCode", "");
      setCoupon(null);
      setCouponMsg("");
    } else if (value === "__other__") {
      // 手入力欄を表示（couponCode は手入力に委ねる）
      setCouponMsg("");
    } else {
      set("couponCode", value);
      applyCouponCode(value);
    }
  };

  // 確定・プレビュー共通の reservation ペイロードを組み立てる
  const buildReservation = () => {
    const override = form.roomTotalOverride.trim() === "" ? null : Number(form.roomTotalOverride);
    const guest_counts = {
      unit_1: {
        [form.check_in_date]: {
          num_male: form.num_male,
          num_female: form.num_female,
          num_child_with_bed: form.num_child_with_bed,
          num_child_no_bed: form.num_child_no_bed,
        },
      },
    };
    return {
      name: stripTrailingSama(form.name),
      name_kana: form.name_kana,
      email: form.email,
      phone_number: normalizePhoneNumber(form.phone_number),
      postal_code: form.postal_code,
      prefecture: form.prefecture,
      city_address: form.city_address,
      check_in_date: form.check_in_date,
      num_nights: form.num_nights,
      num_units: form.num_units,
      guest_counts,
      estimated_check_in_time: form.estimated_check_in_time,
      purpose: form.purpose,
      special_requests: form.special_requests || null,
      mealSelections:
        mealSelections.length > 0
          ? mealSelections.map((m) => ({ ...m, unitId: "unit_1", date: form.check_in_date }))
          : [],
      roomTotalOverride: override,
    };
  };

  const handlePreview = async () => {
    if (!form.check_in_date) {
      toast({ title: "チェックイン日を入力してください", variant: "destructive" });
      return;
    }
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const token = await getToken();
      const res = await fetch("/api/admin/rebooking/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reservation: buildReservation(), couponCode: form.couponCode || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "プレビュー生成に失敗しました");
      setPreviewGuestHtml(json.guestHtml);
      setPreviewAdminHtml(json.adminHtml);
    } catch (e) {
      toast({ title: "エラー", description: e instanceof Error ? e.message : "失敗", variant: "destructive" });
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 確定ボタン：入力チェック後、同日の既存予約（満室警告用）を取得して確認モーダルを開く
  const requestConfirm = async () => {
    if (!targetId) {
      toast({ title: "キャンセル対象を選択してください", variant: "destructive" });
      return;
    }
    if (!form.name || !form.email || !form.check_in_date) {
      toast({ title: "必須項目が未入力です", description: "氏名・メール・宿泊日", variant: "destructive" });
      return;
    }
    if (preview && preview.missingDates.length > 0 && form.roomTotalOverride.trim() === "") {
      toast({
        title: "料金表に無い日付があります",
        description: `${preview.missingDates.join(", ")} の宿泊料金を手動入力してください`,
        variant: "destructive",
      });
      return;
    }
    // 新予約の宿泊期間に「重なる」占有予約を取得（連泊対応・キャンセル対象は除外）
    try {
      const token = await getToken();
      const firstNight = form.check_in_date;
      const lastNight = addDaysISO(firstNight, form.num_nights - 1);
      const lookbackStart = addDaysISO(firstNight, -30); // 前日開始の連泊も拾うため遡る
      const res = await fetch(
        `/api/admin/reservations/search?from=${lookbackStart}&to=${lastNight}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const json = await res.json();
      const all: SearchResult[] = (res.ok ? json.reservations ?? [] : []).filter(
        (r: SearchResult) => r.id !== targetId
      );
      // 新予約が占有する各泊
      const newNights = new Set<string>();
      for (let i = 0; i < form.num_nights; i++) newNights.add(addDaysISO(firstNight, i));
      // 既存予約を各泊に展開し、新予約の泊と重なるものだけ抽出＋占有棟数を集計
      const occ: Record<string, number> = {};
      const overlapping = all.filter((r) => {
        let overlaps = false;
        const rn = r.num_nights || 1;
        for (let i = 0; i < rn; i++) {
          const d = addDaysISO(r.check_in_date, i);
          if (newNights.has(d)) {
            overlaps = true;
            occ[d] = (occ[d] || 0) + (r.num_units || 1);
          }
        }
        return overlaps;
      });
      setConflicts(overlapping);
      setConflictOcc(occ);
    } catch {
      setConflicts([]);
      setConflictOcc({});
    }
    setConfirmOpen(true);
  };

  // 確認モーダルの「確定」：実際に作り直しを送信する
  const doSubmit = async () => {
    if (!targetId) return;
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const token = await getToken();
      const body = {
        targetReservationId: targetId,
        couponCode: form.couponCode || null,
        reservation: buildReservation(),
        sendToNeppan,
      };
      const res = await fetch("/api/admin/rebooking", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "作り直しに失敗しました");
      const neppanMsg =
        json.neppanSent === null || json.neppanSent === undefined
          ? "ねっぱん: 送信なし"
          : json.neppanSent
          ? "ねっぱん: 送信済"
          : `ねっぱん: 送信失敗(${json.neppanError ?? ""})`;
      toast({
        title: "作り直し完了",
        description: `新予約番号: ${json.newReservationNumber} / メール: ${json.emailSent ? "送信済" : "送信失敗"} / ${neppanMsg}`,
      });
      // 後処理：選択リセット
      setTargetId(null);
      setSearchResults([]);
    } catch (e) {
      toast({ title: "エラー", description: e instanceof Error ? e.message : "失敗", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (adminLoading) return <div className="p-8">読み込み中...</div>;

  const yen = (n: number) => `¥${n.toLocaleString()}`;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-8">
      <h1 className="text-2xl font-bold">予約の作り直し（ねっぱん→本サイト）</h1>

      {/* 1. 貼り付け自動入力 */}
      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">① 予約情報を貼り付け</h2>
        <textarea
          className="w-full border rounded p-2 h-44 font-mono text-sm"
          placeholder={"宿泊希望日：9/21　1泊\nお名前：…\n…"}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
        />
        <Button onClick={handleParse} disabled={!pasteText.trim()}>
          解析してフォームに反映
        </Button>
      </section>

      {/* 2. キャンセル対象の検索 */}
      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">② キャンセル対象（既存予約）を検索・選択</h2>
        <div className="flex flex-wrap gap-2">
          <input className="border rounded px-2 py-1" placeholder="氏名" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
          <input className="border rounded px-2 py-1" placeholder="電話番号" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} />
          <input className="border rounded px-2 py-1" type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
          <Button variant="outline" onClick={handleSearch} disabled={searching}>
            {searching ? "検索中…" : "検索"}
          </Button>
        </div>
        {searchResults.length > 0 && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-2">選択</th>
                <th className="p-2">予約番号</th>
                <th className="p-2">氏名</th>
                <th className="p-2">宿泊日</th>
                <th className="p-2">泊/棟</th>
                <th className="p-2">状態</th>
                <th className="p-2">ねっぱんID</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((r) => (
                <tr key={r.id} className={targetId === r.id ? "bg-blue-50" : ""}>
                  <td className="p-2">
                    <input type="radio" name="target" checked={targetId === r.id} onChange={() => setTargetId(r.id)} />
                  </td>
                  <td className="p-2">{r.reservation_number}</td>
                  <td className="p-2">{r.name}</td>
                  <td className="p-2">{r.check_in_date}</td>
                  <td className="p-2">{r.num_nights}泊/{r.num_units}棟</td>
                  <td className="p-2">{r.reservation_status}</td>
                  <td className="p-2">{r.neppan_reservation_id ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* 3. 新予約フォーム */}
      <section className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">③ 新予約の内容</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="氏名"><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} onBlur={() => set("name", stripTrailingSama(form.name))} /></Field>
          <Field label="フリガナ"><input className="input" value={form.name_kana} onChange={(e) => set("name_kana", e.target.value)} /></Field>
          <Field label="メール"><input className="input" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="電話番号"><input className="input" value={form.phone_number} onChange={(e) => set("phone_number", normalizePhoneNumber(e.target.value))} inputMode="tel" pattern="[0-9-]*" /></Field>
          <Field label="郵便番号"><input className="input" value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} /></Field>
          <Field label="都道府県"><input className="input" value={form.prefecture} onChange={(e) => set("prefecture", e.target.value)} /></Field>
          <Field label="住所（市区町村以下）"><input className="input" value={form.city_address} onChange={(e) => set("city_address", e.target.value)} /></Field>
          <Field label="チェックイン日"><input className="input" type="date" value={form.check_in_date} onChange={(e) => set("check_in_date", e.target.value)} /></Field>
          <Field label="泊数"><input className="input" type="number" min={1} value={form.num_nights} onChange={(e) => set("num_nights", Number(e.target.value))} /></Field>
          <Field label="棟数"><input className="input" type="number" min={1} max={2} value={form.num_units} onChange={(e) => set("num_units", Number(e.target.value))} /></Field>
          <Field label="大人男性"><input className="input" type="number" min={0} value={form.num_male} onChange={(e) => set("num_male", Number(e.target.value))} /></Field>
          <Field label="大人女性"><input className="input" type="number" min={0} value={form.num_female} onChange={(e) => set("num_female", Number(e.target.value))} /></Field>
          <Field label="子供(寝具あり)"><input className="input" type="number" min={0} value={form.num_child_with_bed} onChange={(e) => set("num_child_with_bed", Number(e.target.value))} /></Field>
          <Field label="子供(寝具なし)"><input className="input" type="number" min={0} value={form.num_child_no_bed} onChange={(e) => set("num_child_no_bed", Number(e.target.value))} /></Field>
          <Field label="チェックイン時間"><input className="input" value={form.estimated_check_in_time} onChange={(e) => set("estimated_check_in_time", e.target.value)} /></Field>
          <Field label="利用目的">
            <select className="input" value={form.purpose} onChange={(e) => set("purpose", e.target.value)}>
              {PURPOSE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="食事プラン">
            <select className="input" value={form.mealPlanId} onChange={(e) => set("mealPlanId", e.target.value)}>
              {foodPlans.map((p) => <option key={p.id} value={p.id}>{p.name}（{p.price.toLocaleString()}円）</option>)}
            </select>
          </Field>
          <Field label="食事 人前"><input className="input" type="number" min={0} value={form.mealCount} onChange={(e) => set("mealCount", Number(e.target.value))} /></Field>
        </div>
        <Field label="特記事項"><textarea className="input" value={form.special_requests} onChange={(e) => set("special_requests", e.target.value)} /></Field>

        <div className="space-y-2">
          <Field label="クーポン">
            <select className="input" value={couponSelect} onChange={(e) => handleCouponSelect(e.target.value)}>
              <option value="">なし</option>
              {COUPON_PRESETS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
              <option value="__other__">その他（手入力）</option>
            </select>
          </Field>
          {couponSelect === "__other__" && (
            <div className="flex flex-wrap items-end gap-2">
              <Field label="クーポンコード（手入力）">
                <input className="input" value={form.couponCode} onChange={(e) => set("couponCode", e.target.value)} />
              </Field>
              <Button variant="outline" onClick={handleApplyCoupon}>
                適用
              </Button>
            </div>
          )}
          {couponMsg && <span className="text-sm text-green-700">{couponMsg}</span>}
        </div>

        {preview && preview.missingDates.length > 0 && (
          <Field label={`宿泊料金を手動入力（料金表外: ${preview.missingDates.join(", ")}）`}>
            <input className="input" type="number" placeholder="棟数込みの宿泊料金合計" value={form.roomTotalOverride} onChange={(e) => set("roomTotalOverride", e.target.value)} />
          </Field>
        )}
      </section>

      {/* 4. 料金プレビュー＋確定 */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="font-semibold">④ 料金確認・確定</h2>
        {preview && (
          <div className="text-sm space-y-1">
            <div>宿泊料金: {yen(preview.roomTotal)}</div>
            <div>食事料金: {yen(preview.mealTotal)}</div>
            <div>割引: -{yen(preview.discount)}</div>
            <div className="font-bold">現地お支払い: {yen(preview.paymentAmount)}</div>
          </div>
        )}
        <p className="text-xs text-gray-500">
          確定すると、選択した既存予約をキャンセル（メールなし）し、新予約を作成してお客様・管理者へメール送信します。ねっぱんへは送信しません。
        </p>
        {!targetId && (
          <p className="text-sm text-red-600">
            ※「② キャンセル対象（既存予約）」を検索してラジオで選択すると確定できます。
          </p>
        )}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={sendToNeppan}
            onChange={(e) => setSendToNeppan(e.target.checked)}
          />
          <span>
            ねっぱんにも新規予約を送信する（フロント予約と同じ <code>/create_reservation</code>）
            <br />
            <span className="text-xs text-gray-500">
              ※新規作成のみ送信します。元のねっぱん予約のキャンセルは送りません（重複に注意）。
            </span>
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={previewLoading || !form.check_in_date}>
            {previewLoading ? "生成中…" : "メール文面プレビュー"}
          </Button>
          <Button onClick={requestConfirm} disabled={submitting || !targetId}>
            {submitting ? "処理中…" : "作り直しを確定する"}
          </Button>
        </div>
      </section>

      {/* 確定確認モーダル（氏名の「様」チェック含む） */}
      {confirmOpen &&
        (() => {
          const target = searchResults.find((r) => r.id === targetId);
          const rawName = form.name;
          const cleanName = stripTrailingSama(rawName);
          const hadSama = rawName !== cleanName;
          const newNights: string[] = [];
          for (let i = 0; i < form.num_nights; i++) newNights.push(addDaysISO(form.check_in_date, i));
          const overbookNights = newNights.filter((d) => (conflictOcc[d] || 0) + form.num_units > 2);
          const wouldOverbook = overbookNights.length > 0;
          return (
            <div
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
              onClick={() => setConfirmOpen(false)}
            >
              <div className="bg-white rounded-lg w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold">作り直しの確定確認</h3>
                {hadSama && (
                  <div className="rounded bg-yellow-50 border border-yellow-300 p-3 text-sm">
                    ⚠️ 氏名に「様」が含まれていました。
                    <br />
                    <span className="text-gray-600">「{rawName}」</span> →{" "}
                    <b>「{cleanName}」</b> として作成します。
                  </div>
                )}
                {(conflicts.length > 0 || wouldOverbook) && (
                  <div className={`rounded border p-3 text-sm ${wouldOverbook ? "bg-red-50 border-red-300" : "bg-blue-50 border-blue-200"}`}>
                    {wouldOverbook ? (
                      <div className="font-semibold text-red-700">
                        ⚠️ 満室の可能性：{overbookNights.join("、")} は枠が埋まります（このまま作成は可能です）
                      </div>
                    ) : (
                      <div className="font-semibold text-blue-700">同じ期間に既存予約があります</div>
                    )}
                    {/* 泊ごとの占有（キャンセル対象を除く既存 ＋ 今回） */}
                    <div className="mt-1 text-xs text-gray-600">
                      {newNights.map((d) => {
                        const other = conflictOcc[d] || 0;
                        const total = other + form.num_units;
                        return (
                          <span key={d} className={`inline-block mr-3 ${total > 2 ? "text-red-700 font-semibold" : ""}`}>
                            {d}：既存{other}＋今回{form.num_units}＝{total}棟
                          </span>
                        );
                      })}
                    </div>
                    {conflicts.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {conflicts.map((c) => (
                          <li key={c.id} className="border-t pt-1">
                            {c.name}（{c.reservation_number} / {c.check_in_date}〜{c.num_nights}泊 / {c.num_units}棟 / {c.reservation_status}）
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <dl className="text-sm space-y-1">
                  <div>
                    <span className="text-gray-500">キャンセル対象：</span>
                    {target ? `${target.name}（${target.reservation_number} / ${target.check_in_date}）` : `ID ${targetId}`}
                  </div>
                  <div>
                    <span className="text-gray-500">新予約 氏名：</span>
                    {cleanName || "（未入力）"}
                  </div>
                  <div>
                    <span className="text-gray-500">宿泊：</span>
                    {form.check_in_date} ／ {form.num_nights}泊 ／ {form.num_units}棟
                  </div>
                  <div>
                    <span className="text-gray-500">現地お支払い：</span>
                    {preview ? yen(preview.paymentAmount) : "-"}
                  </div>
                  <div>
                    <span className="text-gray-500">クーポン：</span>
                    {form.couponCode || "なし"}
                  </div>
                  <div>
                    <span className="text-gray-500">ねっぱん送信：</span>
                    {sendToNeppan ? "あり（/create_reservation）" : "なし"}
                  </div>
                </dl>
                <p className="text-xs text-gray-500">
                  確定すると、上記の既存予約をキャンセル（メールなし）し、新予約を作成してお客様・管理者へメール送信します。
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={doSubmit} disabled={submitting}>
                    {submitting ? "処理中…" : "この内容で確定"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* メール文面プレビュー モーダル */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded text-sm ${previewTab === "guest" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                  onClick={() => setPreviewTab("guest")}
                >
                  お客様向け
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${previewTab === "admin" ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                  onClick={() => setPreviewTab("admin")}
                >
                  管理者向け
                </button>
              </div>
              <button className="text-gray-500 hover:text-gray-800 text-xl leading-none" onClick={() => setPreviewOpen(false)}>
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 p-2">
              {previewLoading ? (
                <div className="p-8 text-center text-gray-500">生成中…</div>
              ) : (
                <iframe
                  title="email-preview"
                  className="w-full bg-white"
                  style={{ height: "70vh", border: "none" }}
                  srcDoc={previewTab === "guest" ? previewGuestHtml : previewAdminHtml}
                />
              )}
            </div>
            <div className="border-t p-2 text-xs text-gray-500">
              ※ これは確定時に送信される実際の文面です（宛先：お客様＝{form.email || "未入力"} / 管理者＝info.nest.biwako@gmail.com）。
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        :global(.input) {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.375rem 0.5rem;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-gray-600">{label}</span>
      {children}
    </label>
  );
}
