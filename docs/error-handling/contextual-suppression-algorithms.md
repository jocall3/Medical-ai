# Contextual Suppression Algorithms: Technical Specifications

## Overview
This document specifies the logic for the AI's ability to suppress false-positive alerts based on real-time environmental and clinical context. The goal is to ensure that AI alerts are only generated when they represent a deviation from the *expected* state of the patient.

## 1. Input Vector Requirements
To perform contextual suppression, the engine requires a synchronized data stream from the following sources:
- **IoT Vitals:** HR, SpO2, BP, Respiratory Rate.
- **Activity Monitor:** 3-axis accelerometer, gyroscope (detecting movement/position).
- **Medication Pump API:** Real-time infusion rates and drug types.
- **EHR Schedule:** Scheduled procedures, therapy sessions, and nursing rounds.

## 2. Suppression Logic Flow

### 2.1 Physical Therapy (PT) Suppression
**Trigger:** Heart Rate (HR) > 110 bpm AND Respiratory Rate (RR) > 22 bpm.
**Context Check:**
1. Is the patient's location 'Gym' or 'Hallway'?
2. Is the accelerometer detecting rhythmic movement?
3. Is there a scheduled PT session in the EHR?
**Action:** If all three are TRUE, suppress the 'Tachycardia' and 'Tachypnea' alerts. Log as `EXPECTED_EXERTION`.

### 2.2 Routine Medication Suppression
**Trigger:** Blood Pressure (BP) drop > 20% within 10 minutes.
**Context Check:**
1. Is a vasodilator or antihypertensive drug currently being infused via the smart pump?
2. Is the rate of infusion increasing?
**Action:** If TRUE, suppress the 'Hypotension' alert for a window of 15 minutes. Log as `MEDICATION_RESPONSE`.

## 3. False-Negative Guardrails
To prevent the AI from suppressing a *real* emergency during a routine activity, the system implements 'Hard-Stop' overrides:
- **Critical Thresholds:** If SpO2 drops below 80% or HR drops below 40 bpm, suppression is immediately disabled regardless of context.
- **Anomaly Detection:** If the vitals deviate from the *expected* PT profile (e.g., HR spikes but movement stops), the suppression is revoked and a 'CRITICAL_SUDDEN_CHANGE' alert is issued.