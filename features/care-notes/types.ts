export type CareNote = {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  category: string | null;
  created_at: string;
  updated_at: string;
};

export type CareNoteInput = {
  title: string | null;
  body: string;
  category: string | null;
};
