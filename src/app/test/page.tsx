"use client";

import React, { useState } from "react";

const TestReservationPage = () => {
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const handleTestReservation = async () => {
    const testReservationData = {
      reservation_number: "test-1234",
      name: "テスト 太郎",
      name_kana: "テスト タロウ",
      email: "test@example.com",
      gender: "male",
      birth_date: "1990-01-01",
      phone_number: "090-1234-5678",
      postal_code: "123-4567",
      prefecture: "東京都",
      city_address: "新宿区テスト町1-2-3",
      building_name: "テストビル202",
      past_stay: false,
      check_in_date: "2025-01-01",
      num_nights: 2,
      num_units: 1,
      estimated_check_in_time: "15:00:00",
      purpose: "other",
      special_requests: "特に無し",
      transportation_method: "car",
      room_rate: 50000,
      room_rates: [
        { date: "2025-01-01", price: 25000 },
        { date: "2025-01-02", price: 25000 },
      ],
      meal_plans: {},
      guest_counts: {
        unit_1: {
          "2025-01-01": {
            num_male: 1,
            num_female: 0,
            num_child_with_bed: 0,
            num_child_no_bed: 0,
          },
          "2025-01-02": {
            num_male: 1,
            num_female: 0,
            num_child_with_bed: 0,
            num_child_no_bed: 0,
          },
        },
      },
      total_guests: 1,
      guests_with_meals: 0,
      total_meal_price: 0,
      total_amount: 50000,
      reservation_status: "pending",
      stripe_payment_intent_id: null,
      payment_amount: 50000,
      payment_status: "pending",
      payment_method: "onsite",
      coupon_code: null,
      affiliate_id: null,
    };

    try {
      const response = await fetch(
        "https://23df-34-97-214-132.ngrok-free.app/create_reservation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testReservationData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setResponseMessage(`Success: ${result.message}`);
      } else {
        setResponseMessage(
          `Error: ${result.detail || "Failed to create reservation"}`
        );
      }
    } catch (error: any) {
      setResponseMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Reservation Test Page</h1>
      <button
        onClick={handleTestReservation}
        style={{ padding: "10px 20px", marginBottom: "20px" }}
      >
        Send Test Reservation
      </button>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
};

export default TestReservationPage;
