const { z } = require('zod');

const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const SORTABLE_FIELDS = ['created_at', 'updated_at', 'due_date', 'title'];

const dueDateField = z.preprocess(
  v => (v === '' ? null : v),
  z.string().datetime({ offset: true }).nullable().optional()
);

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be at most 255 characters').trim(),
  description: z.string().optional().default(''),
  status: z.enum(VALID_STATUSES).optional().default('todo'),
  due_date: dueDateField,
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title must not be empty').max(255).trim().optional(),
  description: z.string().optional(),
  status: z.enum(VALID_STATUSES).optional(),
  due_date: dueDateField,
}).superRefine((data, ctx) => {
  const defined = Object.entries(data).filter(([, v]) => v !== undefined);
  if (defined.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field must be provided for update',
    });
  }
});

const listTasksSchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  per_page: z.string().regex(/^\d+$/).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  search: z.string().optional(),
  due_before: z.string().datetime({ offset: true }).optional(),
  due_after: z.string().datetime({ offset: true }).optional(),
  sort_by: z.enum(SORTABLE_FIELDS).optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

module.exports = { createTaskSchema, updateTaskSchema, listTasksSchema };
