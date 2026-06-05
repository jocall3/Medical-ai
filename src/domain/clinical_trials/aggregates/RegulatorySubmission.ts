import { TrialProtocol } from "../entities/TrialProtocol";
import { Participant } from "../entities/Participant";
import { AdverseEvent } from "../entities/AdverseEvent";
import { TrialArm } from "./TrialArm";

export interface SDTM_DM {
  STUDYID: string;
  USUBJID: string;
  SUBJID: string;
  RFSTDTC: string;
  RFENDTC: string;
  AGE: number;
  AGEU: "YEARS";
  SEX: "M" | "F" | "O";
  ETHNIC: string;
  ARMCD: string;
  ARM: string;
}

export interface SDTM_AE {
  STUDYID: string;
  USUBJID: string;
  AETERM: string;
  AESEV: "MILD" | "MODERATE" | "SEVERE" | "LIFE-THREATENING" | "DEATH";
  AESTDTC: string;
  AEENDTC: string;
  AEREL: string;
  AESER: "Y" | "N";
}

export interface SDTM_EX {
  STUDYID: string;
  USUBJID: string;
  EXTRT: string;
  EXDOSE: number;
  EXSTDTC: string;
}

export interface CDISCPackage {
  studyId: string;
  domain_DM: SDTM_DM[];
  domain_AE: SDTM_AE[];
  domain_EX: SDTM_EX[];
  compiledAt: string;
}

export class RegulatorySubmission {
  public static compileSDTM(
    protocol: TrialProtocol,
    arms: TrialArm[]
  ): CDISCPackage {
    const domain_DM: SDTM_DM[] = [];
    const domain_AE: SDTM_AE[] = [];
    const domain_EX: SDTM_EX[] = [];

    for (const arm of arms) {
      const participants = arm.getParticipants();
      const adverseEvents = arm.getAdverseEvents();

      for (const participant of participants) {
        const usubjid = `${protocol.id}-${participant.id}`;

        domain_DM.push({
          STUDYID: protocol.id,
          USUBJID: usubjid,
          SUBJID: participant.id,
          RFSTDTC: participant.enrolledAt ? participant.enrolledAt.toISOString().split("T")[0] : "",
          RFENDTC: participant.status === "Completed" ? new Date().toISOString().split("T")[0] : "",
          AGE: participant.demographics.age,
          AGEU: "YEARS",
          SEX: participant.demographics.sex,
          ETHNIC: participant.demographics.ethnicity,
          ARMCD: arm.id,
          ARM: arm.name
        });

        if (participant.enrolledAt) {
          domain_EX.push({
            STUDYID: protocol.id,
            USUBJID: usubjid,
            EXTRT: arm.name,
            EXDOSE: arm.name.toLowerCase().includes("high") ? 100 : arm.name.toLowerCase().includes("low") ? 25 : 0,
            EXSTDTC: participant.enrolledAt.toISOString().split("T")[0]
          });
        }

        const participantAEs = adverseEvents.filter(ae => ae.participantId === participant.id);
        for (const ae of participantAEs) {
          let aesev: "MILD" | "MODERATE" | "SEVERE" | "LIFE-THREATENING" | "DEATH" = "MILD";
          if (ae.severity === 2) aesev = "MODERATE";
          else if (ae.severity === 3) aesev = "SEVERE";
          else if (ae.severity === 4) aesev = "LIFE-THREATENING";
          else if (ae.severity === 5) aesev = "DEATH";

          domain_AE.push({
            STUDYID: protocol.id,
            USUBJID: usubjid,
            AETERM: ae.description,
            AESEV: aesev,
            AESTDTC: ae.onsetDate.toISOString().split("T")[0],
            AEENDTC: ae.resolutionDate ? ae.resolutionDate.toISOString().split("T")[0] : "",
            AEREL: ae.relationship.toUpperCase(),
            AESER: ae.isSeriousAdverseEvent ? "Y" : "N"
          });
        }
      }
    }

    return {
      studyId: protocol.id,
      domain_DM,
      domain_AE,
      domain_EX,
      compiledAt: new Date().toISOString()
    };
  }

  public static validateCDISCCompliance(pkg: CDISCPackage): { compliant: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const dm of pkg.domain_DM) {
      if (!dm.STUDYID) errors.push(`DM: Missing STUDYID for subject ${dm.USUBJID}`);
      if (!dm.USUBJID) errors.push(`DM: Missing USUBJID`);
      if (dm.AGE <= 0) errors.push(`DM: Invalid AGE for subject ${dm.USUBJID}`);
    }

    for (const ae of pkg.domain_AE) {
      if (!ae.AETERM) errors.push(`AE: Missing AETERM for subject ${ae.USUBJID}`);
      if (ae.AESEV === "DEATH" && ae.AESER !== "Y") {
        errors.push(`AE: Adverse event with severity DEATH must be marked as Serious (AESER = 'Y')`);
      }
    }

    return {
      compliant: errors.length === 0,
      errors
    };
  }
}