import { Call } from '../models';

export interface CdrData {
  callId: string;
  direction: 'incoming' | 'outgoing';
  fromNumber: string;
  toNumber: string;
  start: Date;
  answered: Date | null;
  end: Date | null;
  durationSec: number;
  areaCode: string | null;
  cost: number;
  day: string;
}

export function parseCdrLine(line: string): CdrData | null {
  try {
    const fields = line.trim().split('\t');
    
    if (fields.length < 19) {
      console.warn('CDR line has insufficient fields:', line);
      return null;
    }

    const callId = fields[0]?.trim();
    const durationStr = fields[1]?.trim();
    const timeStart = fields[2]?.trim();
    const timeAnswered = fields[3]?.trim();
    const timeEnd = fields[4]?.trim();
    const fromNumber = fields[6]?.trim();
    const toNumber = fields[8]?.trim();
    const billCostStr = fields[17]?.trim();

    if (!callId || !fromNumber || !toNumber || !timeStart) {
      console.warn('CDR line missing required fields:', { callId, fromNumber, toNumber, timeStart });
      return null;
    }

    const start = new Date(timeStart);
    const answered = timeAnswered && timeAnswered !== '0' ? new Date(timeAnswered) : null;
    const end = timeEnd && timeEnd !== '0' ? new Date(timeEnd) : null;

    let durationSec = 0;
    if (durationStr && !isNaN(parseFloat(durationStr))) {
      durationSec = parseFloat(durationStr);
    } else if (end && start) {
      durationSec = Math.round((end.getTime() - start.getTime()) / 1000);
    }

    const direction: 'incoming' | 'outgoing' = toNumber.length <= 5 ? 'incoming' : 'outgoing';
    const areaCode = extractAreaCode(direction === 'incoming' ? fromNumber : toNumber);
    const cost = billCostStr && !isNaN(parseFloat(billCostStr)) ? parseFloat(billCostStr) : 0;
    const day = start.toISOString().split('T')[0];

    return {
      callId,
      direction,
      fromNumber,
      toNumber,
      start,
      answered,
      end,
      durationSec,
      areaCode,
      cost,
      day
    };
  } catch (error) {
    console.error('Error parsing CDR line:', error, 'Line:', line);
    return null;
  }
}

function extractAreaCode(phoneNumber: string): string | null {
  if (!phoneNumber) return null;

  const digits = phoneNumber.replace(/\D/g, '');
  let workingNumber = digits;

  if (workingNumber.length === 11 && workingNumber.startsWith('1')) {
    workingNumber = workingNumber.substring(1);
  }

  if (workingNumber.length === 10) {
    return workingNumber.substring(0, 3);
  }

  return null;
}

export async function saveCdrRecord(cdrData: CdrData): Promise<boolean> {
  try {
    const existingCall = await Call.findOne({ callId: cdrData.callId });
    if (existingCall) {
      console.log('CDR record already exists, skipping:', cdrData.callId);
      return false;
    }

    const call = new Call(cdrData);
    await call.save();

    console.log('CDR record saved:', {
      callId: cdrData.callId,
      direction: cdrData.direction,
      from: cdrData.fromNumber,
      to: cdrData.toNumber,
      duration: cdrData.durationSec
    });

    return true;
  } catch (error) {
    console.error('Error saving CDR record:', error);
    return false;
  }
}
