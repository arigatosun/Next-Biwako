// src/app/components/reservation-form/PersonalInfoForm.tsx

'use client';

import React from 'react';
import styled from 'styled-components';
import { useReservation } from '@/app/contexts/ReservationContext';

// スタイル定義
const SectionContainer = styled.div`
  margin-bottom: 30px;
  width: 100%;
  max-width: 100%;
`;

const SectionTitle = styled.h3`
  background-color: #333;
  color: white;
  padding: 10px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 5px;
  margin-bottom: 15px;
  width: 100%;
`;

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;

  @media (min-width: 640px) {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 15px;
    align-items: start;
  }
`;

const Label = styled.label`
  color: #363331;
  font-weight: bold;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;

  @media (min-width: 640px) {
    margin-bottom: 0;
  }
`;

const RequiredMark = styled.span`
  background-color: red;
  color: white;
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-left: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 40px;
  margin-bottom: 15px;

  @media (min-width: 640px) {
    margin-bottom: 0;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 40px;
  margin-bottom: 15px;

  @media (min-width: 640px) {
    margin-bottom: 0;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;

  @media (min-width: 640px) {
    margin-bottom: 0;
    align-items: center;
  }
`;

const RadioLabel = styled.label`
  color: #363331;
  font-size: 0.85rem;
  white-space: nowrap;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 100px;
  margin-bottom: 15px;

  @media (min-width: 640px) {
    margin-bottom: 0;
  }
`;

const NameInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;

  @media (min-width: 640px) {
    flex-direction: row;
    margin-bottom: 0;
  }
`;

const HalfWidthInput = styled(Input)`
  width: 100%;

  @media (min-width: 640px) {
    width: calc(50% - 5px);
  }
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;

  @media (min-width: 640px) {
    flex-direction: row;
    margin-bottom: 0;
  }
`;

const DateSelect = styled(Select)`
  width: 100%;

  @media (min-width: 640px) {
    width: calc(33.33% - 7px);
  }
`;

export interface PersonalInfoFormData {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  email: string;
  emailConfirm: string;
  gender: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  phone: string;
  postalCode: string;
  prefecture: string;
  address: string;
  buildingName?: string;
  transportation: string;
  checkInTime: string;
  pastStay: string;
  notes?: string;
  purpose: string;
  purposeDetails?: string;
}

interface PersonalInfoFormProps {
  onDataChange: (data: PersonalInfoFormData) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ onDataChange }) => {
  const { state, dispatch } = useReservation();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const form = event.currentTarget.form;
    if (form) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      // 各フィールドを明示的にstring型に変換
      const personalInfoData: PersonalInfoFormData = {
        lastName: (data.lastName as string) || '',
        firstName: (data.firstName as string) || '',
        lastNameKana: (data.lastNameKana as string) || '',
        firstNameKana: (data.firstNameKana as string) || '',
        email: (data.email as string) || '',
        emailConfirm: (data.emailConfirm as string) || '',
        gender: (data.gender as string) || '',
        birthYear: (data.birthYear as string) || '',
        birthMonth: (data.birthMonth as string) || '',
        birthDay: (data.birthDay as string) || '',
        phone: (data.phone as string) || '',
        postalCode: (data.postalCode as string) || '',
        prefecture: (data.prefecture as string) || '',
        address: (data.address as string) || '',
        buildingName: (data.buildingName as string) || '',
        transportation: (data.transportation as string) || '',
        checkInTime: (data.checkInTime as string) || '',
        pastStay: (data.pastStay as string) || '',
        notes: (data.notes as string) || '',
        purpose: (data.purpose as string) || '',
        purposeDetails: (data.purposeDetails as string) || '',
      };

      onDataChange(personalInfoData);
    }
  };

  return (
    <FormContainer>
      {/* 各入力フィールドにonChange={handleChange}を追加 */}
      {/* 氏名 */}
      <Label>
        氏名
        <RequiredMark>必須</RequiredMark>
      </Label>
      <NameInputGroup>
        <HalfWidthInput type="text" name="lastName" placeholder="姓" required onChange={handleChange} />
        <HalfWidthInput type="text" name="firstName" placeholder="名" required onChange={handleChange} />
      </NameInputGroup>

      {/* 他のフィールドも同様に、onChange={handleChange}を追加 */}
      {/* 以下、省略せずにすべてのフィールドにhandleChangeを追加します */}

      {/* 氏名 (ふりがな) */}
      <Label>
        氏名 (ふりがな)
        <RequiredMark>必須</RequiredMark>
      </Label>
      <NameInputGroup>
        <HalfWidthInput type="text" name="lastNameKana" placeholder="せい" required onChange={handleChange} />
        <HalfWidthInput type="text" name="firstNameKana" placeholder="めい" required onChange={handleChange} />
      </NameInputGroup>

      {/* メールアドレス */}
      <Label>
        メールアドレス
        <RequiredMark>必須</RequiredMark>
      </Label>
      <Input type="email" name="email" required onChange={handleChange} />

      {/* メールアドレス (確認用) */}
      <Label>
        メールアドレス (確認用)
        <RequiredMark>必須</RequiredMark>
      </Label>
      <Input type="email" name="emailConfirm" required onChange={handleChange} />

      {/* 性別 */}
      <Label>
        性別
        <RequiredMark>必須</RequiredMark>
      </Label>
      <RadioGroup>
        <input type="radio" id="male" name="gender" value="male" required onChange={handleChange} />
        <RadioLabel htmlFor="male">男性</RadioLabel>
        <input type="radio" id="female" name="gender" value="female" required onChange={handleChange} />
        <RadioLabel htmlFor="female">女性</RadioLabel>
      </RadioGroup>

      {/* 生年月日 */}
      <Label>
        生年月日
        <RequiredMark>必須</RequiredMark>
      </Label>
      <DateInputGroup>
        <DateSelect name="birthYear" required onChange={handleChange}>
          <option value="">年</option>
          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </DateSelect>
        <DateSelect name="birthMonth" required onChange={handleChange}>
          <option value="">月</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </DateSelect>
        <DateSelect name="birthDay" required onChange={handleChange}>
          <option value="">日</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </DateSelect>
      </DateInputGroup>

      {/* 電話番号 */}
      <Label>
        電話番号 (主)
        <RequiredMark>必須</RequiredMark>
      </Label>
      <Input type="tel" name="phone" required onChange={handleChange} />

      {/* 郵便番号 */}
      <Label>
        郵便番号
        <RequiredMark>必須</RequiredMark>
      </Label>
      <Input type="text" name="postalCode" required onChange={handleChange} />

      {/* 都道府県 */}
      <Label>
        都道府県
        <RequiredMark>必須</RequiredMark>
      </Label>
      <Select name="prefecture" required onChange={handleChange}>
        <option value="">選択してください</option>
        {[
          '北海道',
          '青森県',
          '岩手県',
          '宮城県',
          '秋田県',
          '山形県',
          '福島県',
          '茨城県',
          '栃木県',
          '群馬県',
          '埼玉県',
          '千葉県',
          '東京都',
          '神奈川県',
          '新潟県',
          '富山県',
          '石川県',
          '福井県',
          '山梨県',
          '長野県',
          '岐阜県',
          '静岡県',
          '愛知県',
          '三重県',
          '滋賀県',
          '京都府',
          '大阪府',
          '兵庫県',
          '奈良県',
          '和歌山県',
          '鳥取県',
          '島根県',
          '岡山県',
          '広島県',
          '山口県',
          '徳島県',
          '香川県',
          '愛媛県',
          '高知県',
          '福岡県',
          '佐賀県',
          '長崎県',
          '熊本県',
          '大分県',
          '宮崎県',
          '鹿児島県',
          '沖縄県',
        ].map((pref) => (
          <option key={pref} value={pref}>
            {pref}
          </option>
        ))}
      </Select>

      {/* 市区町村／番地 */}
      <Label>
        市区町村／番地
        <RequiredMark>必須</RequiredMark>
      </Label>
      <Input type="text" name="address" required onChange={handleChange} />

      {/* 建物名・アパート名など */}
      <Label>建物名・アパート名など</Label>
      <Input type="text" name="buildingName" onChange={handleChange} />

      {/* 当日の交通手段 */}
      <Label>
        当日の交通手段
        <RequiredMark>必須</RequiredMark>
      </Label>
      <RadioGroup>
        <input type="radio" id="car" name="transportation" value="car" required onChange={handleChange} />
        <RadioLabel htmlFor="car">車</RadioLabel>
        <input type="radio" id="train" name="transportation" value="train" required onChange={handleChange} />
        <RadioLabel htmlFor="train">JR・電車</RadioLabel>
        <input type="radio" id="other" name="transportation" value="other" required onChange={handleChange} />
        <RadioLabel htmlFor="other">その他</RadioLabel>
      </RadioGroup>

      {/* チェックインの予定時間 */}
      <Label>
        チェックインの予定時間
        <RequiredMark>必須</RequiredMark>
      </Label>
      <Select name="checkInTime" required onChange={handleChange}>
        <option value="">選択してください</option>
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
          <option key={hour} value={`${hour}:00`}>
            {`${hour}:00`}
          </option>
        ))}
      </Select>

      {/* 過去のご宿泊 */}
      <Label>
        過去のご宿泊
        <RequiredMark>必須</RequiredMark>
      </Label>
      <RadioGroup>
        <input type="radio" id="firstTime" name="pastStay" value="firstTime" required onChange={handleChange} />
        <RadioLabel htmlFor="firstTime">今回がはじめて</RadioLabel>
        <input type="radio" id="repeat" name="pastStay" value="repeat" required onChange={handleChange} />
        <RadioLabel htmlFor="repeat">以前に宿泊しています</RadioLabel>
      </RadioGroup>

      {/* その他ご要望など */}
      <Label>その他ご要望など</Label>
      <TextArea name="notes" onChange={handleChange}></TextArea>

      {/* ご利用目的 */}
<Label>
  ご利用目的
  <RequiredMark>必須</RequiredMark>
</Label>
<RadioGroup>
  <input type="radio" id="travel" name="purpose" value="travel" required onChange={handleChange} />
  <RadioLabel htmlFor="travel">ご旅行</RadioLabel>
  <input type="radio" id="anniversary" name="purpose" value="anniversary" required onChange={handleChange} />
  <RadioLabel htmlFor="anniversary">記念日</RadioLabel>
  <input type="radio" id="birthday_adult" name="purpose" value="birthday_adult" required onChange={handleChange} />
  <RadioLabel htmlFor="birthday_adult">お誕生日(20歳以上)</RadioLabel>
  <input type="radio" id="birthday_minor" name="purpose" value="birthday_minor" required onChange={handleChange} />
  <RadioLabel htmlFor="birthday_minor">お誕生日(19歳以下)</RadioLabel>
  <input type="radio" id="purposeOther" name="purpose" value="other" required onChange={handleChange} />
  <RadioLabel htmlFor="purposeOther">その他</RadioLabel>
</RadioGroup>


      {/* その他詳細 */}
      <Label>その他詳細</Label>
      <Input type="text" name="purposeDetails" onChange={handleChange} />
    </FormContainer>
  );
};

export default PersonalInfoForm;