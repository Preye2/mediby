export type ReportT = {
  sessionId: string;
  agent: string;
  user: string;
  timestamp: string;
  mainComplaint: string;
  symptoms: string[];
  summary: string;
  duration: string;
  severity: string;          // <-- widen to string
  medicationsMentioned: string[];
  recommendations: string[];
};

export type HistoryT = {
  sessionId: string;   // map from Session.sessionId
  createdAt: string;   // map from Session.createdOn
  report?: ReportT;
};