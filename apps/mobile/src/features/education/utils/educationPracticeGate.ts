export type EducationPracticeGate = {
  active: boolean;
  questionId: string;
  checking: boolean;
  hasResult: boolean;
  advancing: boolean;
};

export function createEducationPracticeGate(questionId: string): EducationPracticeGate {
  return { active: true, questionId, checking: false, hasResult: false, advancing: false };
}

export function activateEducationPracticeGate(gate: EducationPracticeGate, questionId: string): void {
  gate.active = true;
  gate.questionId = questionId;
  gate.checking = false;
  gate.hasResult = false;
  gate.advancing = false;
}

export function claimEducationPracticeCheck(gate: EducationPracticeGate, questionId: string): boolean {
  if (!gate.active || gate.questionId !== questionId || gate.checking || gate.hasResult || gate.advancing) return false;
  gate.checking = true;
  return true;
}

export function finishEducationPracticeCheck(gate: EducationPracticeGate, questionId: string): boolean {
  if (!gate.active || gate.questionId !== questionId || !gate.checking) return false;
  gate.checking = false;
  gate.hasResult = true;
  return true;
}

export function failEducationPracticeCheck(gate: EducationPracticeGate, questionId: string): boolean {
  if (!gate.active || gate.questionId !== questionId || !gate.checking) return false;
  gate.checking = false;
  return true;
}

export function resetEducationPracticeQuestion(gate: EducationPracticeGate, questionId: string): void {
  if (!gate.active) return;
  gate.questionId = questionId;
  gate.checking = false;
  gate.hasResult = false;
  gate.advancing = false;
}

export function claimEducationPracticeAdvance(gate: EducationPracticeGate, questionId: string): boolean {
  if (!gate.active || gate.questionId !== questionId || gate.advancing || gate.checking) return false;
  gate.advancing = true;
  return true;
}

export function deactivateEducationPracticeGate(gate: EducationPracticeGate): void {
  gate.active = false;
  gate.checking = false;
}
