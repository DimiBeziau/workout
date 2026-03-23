import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull().default(0),
})

export const sessionTemplates = sqliteTable('session_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  title: text('title').notNull(),
  type: text('type', { enum: ['cardio', 'renfo'] }).notNull(),
  description: text('description').notNull().default(''),
  createdAt: integer('created_at').notNull().default(0),
})

export const weeklyPlans = sqliteTable('weekly_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  weekStart: text('week_start').notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  sessionTemplateId: integer('session_template_id'),
  scheduledTime: text('scheduled_time'), // HH:MM local time, nullable
  createdAt: integer('created_at').notNull().default(0),
})

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: integer('created_at').notNull().default(0),
})

export const usersRelations = relations(users, ({ many }) => ({
  sessionTemplates: many(sessionTemplates),
  weeklyPlans: many(weeklyPlans),
  pushSubscriptions: many(pushSubscriptions),
}))

export const sessionTemplatesRelations = relations(sessionTemplates, ({ one }) => ({
  user: one(users, { fields: [sessionTemplates.userId], references: [users.id] }),
}))

export const weeklyPlansRelations = relations(weeklyPlans, ({ one }) => ({
  user: one(users, { fields: [weeklyPlans.userId], references: [users.id] }),
  sessionTemplate: one(sessionTemplates, {
    fields: [weeklyPlans.sessionTemplateId],
    references: [sessionTemplates.id],
  }),
}))

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}))

export type User = typeof users.$inferSelect
export type SessionTemplate = typeof sessionTemplates.$inferSelect
export type WeeklyPlan = typeof weeklyPlans.$inferSelect
export type NewSessionTemplate = typeof sessionTemplates.$inferInsert
export type PushSubscription = typeof pushSubscriptions.$inferSelect
