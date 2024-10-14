import React from 'react';
import styled from 'styled-components';

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
    onSubmit: (data: PersonalInfoFormData) => void;
    isMobile: boolean; 
  }
  
  export default function PersonalInfoForm({ onSubmit }: PersonalInfoFormProps) {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const formData = new FormData(formElement);
        
        const data: PersonalInfoFormData = {
            lastName: formData.get('lastName') as string,
            firstName: formData.get('firstName') as string,
            lastNameKana: formData.get('lastNameKana') as string,
            firstNameKana: formData.get('firstNameKana') as string,
            email: formData.get('email') as string,
            emailConfirm: formData.get('emailConfirm') as string,
            gender: formData.get('gender') as string,
            birthYear: formData.get('birthYear') as string,
            birthMonth: formData.get('birthMonth') as string,
            birthDay: formData.get('birthDay') as string,
            phone: formData.get('phone') as string,
            postalCode: formData.get('postalCode') as string,
            prefecture: formData.get('prefecture') as string,
            address: formData.get('address') as string,
            buildingName: formData.get('buildingName') as string | undefined,
            transportation: formData.get('transportation') as string,
            checkInTime: formData.get('checkInTime') as string,
            pastStay: formData.get('pastStay') as string,
            notes: formData.get('notes') as string | undefined,
            purpose: formData.get('purpose') as string,
            purposeDetails: formData.get('purposeDetails') as string | undefined,
        };

        onSubmit(data);
    };

    return (
      <SectionContainer>
        <SectionTitle>予約者情報の入力</SectionTitle>
        <FormContainer onSubmit={handleSubmit}>
          <Label>
            氏名
            <RequiredMark>必須</RequiredMark>
          </Label>
          <NameInputGroup>
            <HalfWidthInput type="text" name="lastName" placeholder="姓" required />
            <HalfWidthInput type="text" name="firstName" placeholder="名" required />
          </NameInputGroup>
  
          <Label>
            氏名 (ふりがな)
            <RequiredMark>必須</RequiredMark>
          </Label>
          <NameInputGroup>
            <HalfWidthInput type="text" name="lastNameKana" placeholder="せい" required />
            <HalfWidthInput type="text" name="firstNameKana" placeholder="めい" required />
          </NameInputGroup>
  
          <Label>
            メールアドレス
            <RequiredMark>必須</RequiredMark>
          </Label>
          <Input type="email" name="email" required />
  
          <Label>
            メールアドレス (確認用)
            <RequiredMark>必須</RequiredMark>
          </Label>
          <Input type="email" name="emailConfirm" required />
  
          <Label>
            性別
            <RequiredMark>必須</RequiredMark>
          </Label>
          <RadioGroup>
            <input type="radio" id="male" name="gender" value="male" required />
            <RadioLabel htmlFor="male">男性</RadioLabel>
            <input type="radio" id="female" name="gender" value="female" required />
            <RadioLabel htmlFor="female">女性</RadioLabel>
          </RadioGroup>
  
          <Label>
            生年月日
            <RequiredMark>必須</RequiredMark>
          </Label>
          <DateInputGroup>
            <DateSelect name="birthYear" required>
              <option value="">年</option>
              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </DateSelect>
            <DateSelect name="birthMonth" required>
              <option value="">月</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </DateSelect>
            <DateSelect name="birthDay" required>
              <option value="">日</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </DateSelect>
          </DateInputGroup>
  
          {/* 他の入力フィールドも同様に実装 */}
          
          <Label>
            電話番号 (主)
            <RequiredMark>必須</RequiredMark>
          </Label>
          <Input type="tel" name="phone" required />
  
          <Label>
            郵便番号
            <RequiredMark>必須</RequiredMark>
          </Label>
          <Input type="text" name="postalCode" required />
  
          <Label>
            都道府県
            <RequiredMark>必須</RequiredMark>
          </Label>
          <Select name="prefecture" required>
            <option value="">選択してください</option>
            {[
              "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
              "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
              "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
              "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
              "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
              "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
              "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
            ].map(pref => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </Select>
  
          <Label>
            市区町村／番地
            <RequiredMark>必須</RequiredMark>
          </Label>
          <Input type="text" name="address" required />
  
          <Label>建物名・アパート名など</Label>
          <Input type="text" name="buildingName" />
  
          <Label>
            当日の交通手段
            <RequiredMark>必須</RequiredMark>
          </Label>
          <RadioGroup>
            <input type="radio" id="car" name="transportation" value="car" required />
            <RadioLabel htmlFor="car">車</RadioLabel>
            <input type="radio" id="train" name="transportation" value="train" required />
            <RadioLabel htmlFor="train">JR・電車</RadioLabel>
            <input type="radio" id="other" name="transportation" value="other" required />
            <RadioLabel htmlFor="other">その他</RadioLabel>
          </RadioGroup>
  
          <Label>
            チェックインの予定時間
            <RequiredMark>必須</RequiredMark>
          </Label>
          <Select name="checkInTime" required>
            <option value="">選択してください</option>
            {Array.from({ length: 24 }, (_, i) => i).map(hour => (
              <option key={hour} value={`${hour}:00`}>{`${hour}:00`}</option>
            ))}
          </Select>
  
          <Label>
            過去のご宿泊
            <RequiredMark>必須</RequiredMark>
          </Label>
          <RadioGroup>
            <input type="radio" id="firstTime" name="pastStay" value="firstTime" required />
            <RadioLabel htmlFor="firstTime">今回がはじめて</RadioLabel>
            <input type="radio" id="repeat" name="pastStay" value="repeat" required />
            <RadioLabel htmlFor="repeat">以前に宿泊しています</RadioLabel>
          </RadioGroup>
  
          <Label>その他ご要望など</Label>
          <TextArea name="notes"></TextArea>
  
          <Label>
            ご利用目的
            <RequiredMark>必須</RequiredMark>
          </Label>
          <RadioGroup>
            <input type="radio" id="travel" name="purpose" value="travel" required />
            <RadioLabel htmlFor="travel">ご旅行</RadioLabel>
            <input type="radio" id="anniversary" name="purpose" value="anniversary" required />
            <RadioLabel htmlFor="anniversary">記念日</RadioLabel>
            <input type="radio" id="birthday20" name="purpose" value="birthday20" required />
            <RadioLabel htmlFor="birthday20">お誕生日(20歳以上)</RadioLabel>
            <input type="radio" id="birthday19" name="purpose" value="birthday19" required />
            <RadioLabel htmlFor="birthday19">お誕生日(19歳以下)</RadioLabel>
            <input type="radio" id="purposeOther" name="purpose" value="other" required />
            <RadioLabel htmlFor="purposeOther">その他</RadioLabel>
          </RadioGroup>
  
          <Label>その他詳細</Label>
          <Input type="text" name="purposeDetails" />
        </FormContainer>
      </SectionContainer>
    );
  }