// Kiểu tiện dùng bọc quanh lib/database.types.ts (file sinh tự động, đừng sửa tay).
// Sinh lại bằng: npm run db:types
import type { Database, Json } from './database.types';

type PublicSchema = Database['public'];

/** Một dòng đọc từ bảng: Tables<'lessons'> */
export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];

/** Dữ liệu để thêm mới: TablesInsert<'lessons'> */
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert'];

/** Dữ liệu để cập nhật: TablesUpdate<'lessons'> */
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update'];

/** Giá trị của enum: Enums<'question_type'> */
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T];

export type Role           = Enums<'user_role'>;
export type QuestionType   = Enums<'question_type'>;
export type MaterialType   = Enums<'material_type'>;
export type SubmissionStatus = Enums<'submission_status'>;

export type Profile    = Tables<'profiles'>;
export type Class      = Tables<'classes'>;
export type Lesson     = Tables<'lessons'>;
export type Vocab      = Tables<'vocab'>;
export type Assignment = Tables<'assignments'>;
export type Question   = Tables<'questions'>;
export type Submission = Tables<'submissions'>;

/**
 * `questions.options` lưu jsonb nên kiểu sinh ra là Json. Câu trắc nghiệm luôn
 * ghi vào một mảng chuỗi; các dạng câu hỏi khác để null. Hàm này đọc ra mảng
 * chuỗi và trả mảng rỗng cho mọi trường hợp còn lại.
 */
export function questionOptions(options: Json): string[] {
  return Array.isArray(options) ? options.map((o) => String(o)) : [];
}
