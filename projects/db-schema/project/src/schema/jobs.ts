import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { User } from "./user.js";

export const UserJobs = pgTable("user_jobs", {
  jobId: uuid("job_id").notNull().primaryKey(),
  userId: uuid("user_id").references(() => User.id, { onDelete: "cascade" }),

  isComplete: boolean("is_complete").notNull().default(false),
  statusText: text("status_text").notNull().default("Created"),

  createdAt: timestamp("created_at", {
    mode: "date",
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const UserJobReference = relations(UserJobs, ({ one }) => ({
  user: one(User, {
    fields: [UserJobs.userId],
    references: [User.id],
  }),
}));

export const UserJobReferences = relations(User, ({ many }) => ({
  jobs: many(UserJobs),
}));
