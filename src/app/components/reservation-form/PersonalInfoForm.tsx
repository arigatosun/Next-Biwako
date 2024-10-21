'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { useReservation } from '@/app/contexts/ReservationContext';
import axios from 'axios';

// スタイル定義
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  gap: 20px;
  margin-bottom: 40px;

  @media (min-width: 640px) {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 15px;
    align-items: start;
  }
`;

const FormGroup = styled.div`
  display: contents;
    margin-bottom: 15px;
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
  height: 45px;
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
`;

const Select = styled.select`
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 40px;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  padding-top: 5px; // 追加

  @media (max-width: 639px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;


const RadioLabel = styled.label`
  color: #363331;
  font-size: 1rem;
  display: flex;
  align-items: center;
  white-space: nowrap;
  line-height: 1.5; // 追加
`;



const RadioInput = styled.input`
  margin-right: 5px;
  margin-top: 2px; // 追加
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 100px;
`;

const NameInputGroup = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 639px) {
    flex-direction: column;
  }
`;

const HalfWidthInput = styled(Input)`
  width: calc(50% - 5px);

  @media (max-width: 639px) {
    width: 100%;
  }
`;

const DateInputGroup = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 639px) {
    flex-direction: column;
  }
`;

const DateSelect = styled(Select)`
  width: calc(33.33% - 7px);

  @media (max-width: 639px) {
    width: 100%;
  }
`;

const InputContainer = styled.div`
  width: 100%;
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
  isMobile: boolean;
  initialData?: PersonalInfoFormData | null;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ onDataChange, isMobile, initialData }) => {
  const { state, dispatch } = useReservation();
  const [addressData, setAddressData] = useState({
    prefecture: initialData?.prefecture || '',
    city: initialData?.address || '',
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const form = event.currentTarget.form;
    if (form) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

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

  const handlePostalCodeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const postalCode = event.target.value.replace(/-/g, '');
    if (postalCode.length === 7) {
      try {
        const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
        if (response.data.results) {
          const { address1, address2, address3 } = response.data.results[0];
          setAddressData({
            prefecture: address1,
            city: `${address2}${address3}`,
          });
          // フォームの都道府県と市区町村を更新
          const form = event.target.form;
          if (form) {
            const prefectureSelect = form.elements.namedItem('prefecture') as HTMLSelectElement;
            const addressInput = form.elements.namedItem('address') as HTMLInputElement;
            if (prefectureSelect) prefectureSelect.value = address1;
            if (addressInput) addressInput.value = `${address2}${address3}`;
          }
          handleChange(event);
        }
      } catch (error) {
        console.error('郵便番号の検索に失敗しました', error);
      }
    }
  };

  return (
    <FormContainer className={isMobile ? 'px-4' : ''}>
      <FormGroup>
        <Label>
          氏名
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <NameInputGroup>
            <HalfWidthInput
              type="text"
              name="lastName"
              placeholder="姓"
              required
              onChange={handleChange}
              defaultValue={initialData?.lastName}
            />
            <HalfWidthInput
              type="text"
              name="firstName"
              placeholder="名"
              required
              onChange={handleChange}
              defaultValue={initialData?.firstName}
            />
          </NameInputGroup>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          氏名 (ふりがな)
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <NameInputGroup>
            <HalfWidthInput
              type="text"
              name="lastNameKana"
              placeholder="せい"
              required
              onChange={handleChange}
              defaultValue={initialData?.lastNameKana}
            />
            <HalfWidthInput
              type="text"
              name="firstNameKana"
              placeholder="めい"
              required
              onChange={handleChange}
              defaultValue={initialData?.firstNameKana}
            />
          </NameInputGroup>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          メールアドレス
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <Input
            type="email"
            name="email"
            required
            onChange={handleChange}
            defaultValue={initialData?.email}
          />
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          メールアドレス (確認用)
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <Input
            type="email"
            name="emailConfirm"
            required
            onChange={handleChange}
            defaultValue={initialData?.emailConfirm}
          />
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          性別
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <RadioGroup>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="male"
                name="gender"
                value="male"
                required
                onChange={handleChange}
                defaultChecked={initialData?.gender === 'male'}
              />
              男性
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="female"
                name="gender"
                value="female"
                required
                onChange={handleChange}
                defaultChecked={initialData?.gender === 'female'}
              />
              女性
            </RadioLabel>
          </RadioGroup>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          生年月日
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <DateInputGroup>
            <DateSelect
              name="birthYear"
              required
              onChange={handleChange}
              defaultValue={initialData?.birthYear}
            >
              <option value="">年</option>
              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </DateSelect>
            <DateSelect
              name="birthMonth"
              required
              onChange={handleChange}
              defaultValue={initialData?.birthMonth}
            >
              <option value="">月</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </DateSelect>
            <DateSelect
              name="birthDay"
              required
              onChange={handleChange}
              defaultValue={initialData?.birthDay}
            >
              <option value="">日</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </DateSelect>
          </DateInputGroup>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          電話番号
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <Input
            type="tel"
            name="phone"
            required
            onChange={handleChange}
            defaultValue={initialData?.phone}
          />
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          郵便番号
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <Input
            type="text"
            name="postalCode"
            required
            onChange={(e) => {
              handleChange(e);
              handlePostalCodeChange(e);
            }}
            placeholder="例: 123-4567"
            defaultValue={initialData?.postalCode}
          />
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          都道府県
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <Select
            name="prefecture"
            required
            onChange={handleChange}
            value={addressData.prefecture || initialData?.prefecture}
          >
            <option value="">選択してください</option>
            {[
              '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
              '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
              '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
              '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
              '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
              '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
              '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
            ].map((pref) => (
              <option key={pref} value={pref}>
                {pref}
              </option>
            ))}
          </Select>
        </InputContainer>
      </FormGroup>

      <FormGroup>
      <Label>
          市区町村／番地
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <Input
            type="text"
            name="address"
            required
            onChange={handleChange}
            value={addressData.city || initialData?.address}
          />
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>建物名・アパート名など</Label>
        <InputContainer>
          <Input
            type="text"
            name="buildingName"
            onChange={handleChange}
            defaultValue={initialData?.buildingName}
          />
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          当日の交通手段
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <RadioGroup>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="car"
                name="transportation"
                value="car"
                required
                onChange={handleChange}
                defaultChecked={initialData?.transportation === 'car'}
              />
              車
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="train"
                name="transportation"
                value="train"
                required
                onChange={handleChange}
                defaultChecked={initialData?.transportation === 'train'}
              />
              JR・電車
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="other"
                name="transportation"
                value="other"
                required
                onChange={handleChange}
                defaultChecked={initialData?.transportation === 'other'}
              />
              その他
            </RadioLabel>
          </RadioGroup>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          チェックインの予定時間
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <Select
            name="checkInTime"
            required
            onChange={handleChange}
            defaultValue={initialData?.checkInTime}
          >
            <option value="">選択してください</option>
            {Array.from({ length: 7 }, (_, i) => {
              const hour = 15 + Math.floor(i / 2);
              const minute = i % 2 === 0 ? '00' : '30';
              return `${hour}:${minute}`;
            }).map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </Select>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          過去のご宿泊
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <RadioGroup>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="firstTime"
                name="pastStay"
                value="firstTime"
                required
                onChange={handleChange}
                defaultChecked={initialData?.pastStay === 'firstTime'}
              />
              今回がはじめて
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="repeat"
                name="pastStay"
                value="repeat"
                required
                onChange={handleChange}
                defaultChecked={initialData?.pastStay === 'repeat'}
              />
              以前に宿泊しています
            </RadioLabel>
          </RadioGroup>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>その他ご要望など</Label>
        <InputContainer>
          <TextArea
            name="notes"
            onChange={handleChange}
            defaultValue={initialData?.notes}
          ></TextArea>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>
          ご利用目的
          <RequiredMark>必須</RequiredMark>
        </Label>
        <InputContainer>
          <RadioGroup>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="travel"
                name="purpose"
                value="travel"
                required
                onChange={handleChange}
                defaultChecked={initialData?.purpose === 'travel'}
              />
              ご旅行
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="anniversary"
                name="purpose"
                value="anniversary"
                required
                onChange={handleChange}
                defaultChecked={initialData?.purpose === 'anniversary'}
              />
              記念日
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="birthday_adult"
                name="purpose"
                value="birthday_adult"
                required
                onChange={handleChange}
                defaultChecked={initialData?.purpose === 'birthday_adult'}
              />
              お誕生日(20歳以上)
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="birthday_minor"
                name="purpose"
                value="birthday_minor"
                required
                onChange={handleChange}
                defaultChecked={initialData?.purpose === 'birthday_minor'}
              />
              お誕生日(19歳以下)
            </RadioLabel>
            <RadioLabel>
              <RadioInput
                type="radio"
                id="purposeOther"
                name="purpose"
                value="other"
                required
                onChange={handleChange}
                defaultChecked={initialData?.purpose === 'other'}
              />
              その他
            </RadioLabel>
          </RadioGroup>
        </InputContainer>
      </FormGroup>

      <FormGroup>
        <Label>その他詳細</Label>
        <InputContainer>
          <Input
            type="text"
            name="purposeDetails"
            onChange={handleChange}
            defaultValue={initialData?.purposeDetails}
          />
        </InputContainer>
      </FormGroup>
    </FormContainer>
  );
};

export default PersonalInfoForm;