export type SessionMessage = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  text: string;
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: SessionMessage[];
};
