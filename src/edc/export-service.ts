export interface SubjectCasebook {
  subjectNumber: string;
  siteNumber: string;
  visits: {
    visitCode: string;
    visitName: string;
    actualDate?: string;
    crfs: {
      crfName: string;
      version: string;
      data: Record<string, any>;
    }[];
  }[];
}

export class ExportService {
  public exportToCDISCODM(studyId: string, casebooks: SubjectCasebook[]): string {
    const timestamp = new Date().toISOString();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<ODM xmlns="http://www.cdisc.org/ns/odm/v1.3" \n`;
    xml += `     FileOID="ODM.${studyId}.${timestamp}" \n`;
    xml += `     FileType="Transactional" \n`;
    xml += `     CreationDateTime="${timestamp}" \n`;
    xml += `     ODMVersion="1.3.2">\n`;
    
    xml += `  <Study OID="${studyId}">\n`;
    xml += `    <GlobalVariables>\n`;
    xml += `      <StudyName>Clinical Trial ${studyId}</StudyName>\n`;
    xml += `      <StudyDescription>Exported Clinical Trial Data</StudyDescription>\n`;
    xml += `      <ProtocolName>${studyId}</ProtocolName>\n`;
    xml += `    </GlobalVariables>\n`;
    xml += `  </Study>\n`;

    xml += `  <ClinicalData StudyOID="${studyId}" MetaDataVersionOID="MDV.1">\n`;

    for (const cb of casebooks) {
      xml += `    <SubjectData SubjectKey="${cb.subjectNumber}" SiteRef="${cb.siteNumber}">\n`;
      for (const visit of cb.visits) {
        xml += `      <StudyEventData StudyEventOID="${visit.visitCode}">\n`;
        for (const crf of visit.crfs) {
          xml += `        <FormData FormOID="${crf.crfName}" FormVersion="${crf.version}">\n`;
          xml += `          <ItemGroupData ItemGroupOID="${crf.crfName}_GROUP" TransactionType="Insert">\n`;
          
          for (const [key, value] of Object.entries(crf.data)) {
            const valStr = value !== null && value !== undefined ? String(value) : '';
            xml += `            <ItemData ItemOID="${key}" Value="${this.escapeXml(valStr)}"/>\n`;
          }

          xml += `          </ItemGroupData>\n`;
          xml += `        </FormData>\n`;
        }
        xml += `      </StudyEventData>\n`;
      }
      xml += `    </SubjectData>\n`;
    }

    xml += `  </ClinicalData>\n`;
    xml += `</ODM>`;
    return xml;
  }

  public exportToSDTM(studyId: string, casebooks: SubjectCasebook[]): Record<string, any> {
    const dmDomain: any[] = [];
    const vsDomain: any[] = [];

    for (const cb of casebooks) {
      const usubjid = `${studyId}-${cb.siteNumber}-${cb.subjectNumber}`;
      let age: any = null;
      let sex: any = null;
      let race: any = null;
      let arm: any = 'SCREEN FAILURE';
      let vsSeq = 1;

      for (const visit of cb.visits) {
        for (const crf of visit.crfs) {
          if (crf.crfName.toLowerCase().includes('demographics') || crf.crfName.toLowerCase().includes('dm')) {
            age = crf.data.age || crf.data.AGE;
            sex = crf.data.gender || crf.data.SEX || crf.data.GENDER;
            race = crf.data.race || crf.data.RACE;
            arm = crf.data.treatment_arm || crf.data.ARM || 'UNASSIGNED';
          }

          if (crf.crfName.toLowerCase().includes('vitals') || crf.crfName.toLowerCase().includes('vs')) {
            const date = visit.actualDate || new Date().toISOString().split('T')[0];
            
            const vitalsToMap = [
              { test: 'Systolic Blood Pressure', code: 'SYSBP', val: crf.data.systolic_bp, unit: 'mmHg' },
              { test: 'Diastolic Blood Pressure', code: 'DIABP', val: crf.data.diastolic_bp, unit: 'mmHg' },
              { test: 'Heart Rate', code: 'HR', val: crf.data.heart_rate, unit: 'beats/min' },
              { test: 'Temperature', code: 'TEMP', val: crf.data.temperature, unit: 'C' },
            ];

            for (const vital of vitalsToMap) {
              if (vital.val !== undefined && vital.val !== null) {
                vsDomain.push({
                  STUDYID: studyId,
                  DOMAIN: 'VS',
                  USUBJID: usubjid,
                  VSSEQ: vsSeq++,
                  VSTESTCD: vital.code,
                  VSTEST: vital.test,
                  VSORRES: String(vital.val),
                  VSORRESU: vital.unit,
                  VSSTRESC: String(vital.val),
                  VSSTRESN: Number(vital.val),
                  VSSTRESU: vital.unit,
                  VISITNUM: visit.visitCode,
                  VISIT: visit.visitName,
                  VSDTC: date,
                });
              }
            }
          }
        }
      }

      dmDomain.push({
        STUDYID: studyId,
        DOMAIN: 'DM',
        USUBJID: usubjid,
        SUBJID: cb.subjectNumber,
        RFSTDTC: cb.visits[0]?.actualDate || '',
        SITEID: cb.siteNumber,
        AGE: age ? Number(age) : null,
        AGEU: age ? 'YEARS' : null,
        SEX: sex,
        RACE: race,
        ARM: arm,
      });
    }

    return { 
      studyId,
      domains: {
        DM: dmDomain,
        VS: vsDomain,
      },
    };
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      } 
    });
  }
}