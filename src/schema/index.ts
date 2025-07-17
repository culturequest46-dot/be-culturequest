import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "../routes/user";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  gpa: decimal("gpa", { precision: 3, scale: 2 }),
  graduationYear: integer("graduation_year"),
  gradeLevel: text("grade_level").notNull(), // freshman, sophomore, junior, senior
  schoolName: text("school_name"),
  careerGoals: text("career_goals"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // summer_program, competition, scholarship, internship, course, book, website
  category: text("category").notNull(), // mathematics, science, computer-science, exploratory
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  deadline: text("deadline"),
  cost: text("cost"),
  difficulty: text("difficulty").notNull(), // beginner, intermediate, advanced
  url: text("url"),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eligibles = pgTable("eligibles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique()
});

export const resourceEligibles = pgTable("resource_eligibles", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  eligibleId: integer("eligible_id").references(() => eligibles.id).notNull()
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique()
});

export const resourceTags = pgTable("resource_tags", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").references(() => resources.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull()
});

export const majors = pgTable("majors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique()
});

export const usersMajors = pgTable("user_majors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  majorId: integer("major_id").references(() => majors.id).notNull()
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  personalInfo: jsonb("personal_info").notNull(),
  education: jsonb("education").notNull(),
  activities: jsonb("activities").notNull(),
  awards: jsonb("awards").notNull(),
  workExperience: jsonb("work_experience").notNull(),
  skills: jsonb("skills").notNull(),
  essays: jsonb("essays").notNull(),
  score: integer("score").default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const colleges = pgTable("colleges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  acceptanceRate: decimal("acceptance_rate", { precision: 5, scale: 2 }),
  averageGpa: decimal("average_gpa", { precision: 3, scale: 2 }),
  satRange: jsonb("sat_range"),
  actRange: jsonb("act_range"),
  tuition: integer("tuition"),
  imageUrl: text("image_url"),
  description: text("description"),
  requirements: jsonb("requirements"),
});

export const userColleges = pgTable("user_colleges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  collegeId: integer("college_id").references(() => colleges.id).notNull(),
  status: text("status").notNull(), // interested, applied, accepted, rejected
  priority: integer("priority").default(0),
  matchPercentage: integer("match_percentage"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // mentor, peer, counselor
  content: text("content").notNull(),
  rating: integer("rating"),
  targetSection: text("target_section"), // resume, essay, profile
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deadlines = pgTable("deadlines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  collegeId: integer("college_id").references(() => colleges.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  type: text("type").notNull(), // application, scholarship, test, document
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  isPublic: boolean("is_public").default(true),
  likes: integer("likes").default(0),
  replies: integer("replies").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumReplies = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => forumPosts.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  likes: integer("likes").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // transcript, recommendation, essay
  url: text("url").notNull(),
  size: integer("size"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

// Add grade-level specific guidance and goals table
export const gradeGoals = pgTable("grade_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  gradeLevel: text("grade_level").notNull(),
  goalType: text("goal_type").notNull(), // academic, extracurricular, test_prep, college_prep
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").default(false),
  priority: integer("priority").default(1), // 1-5 scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add grade-specific resources and milestones
export const gradeMilestones = pgTable("grade_milestones", {
  id: serial("id").primaryKey(),
  gradeLevel: text("grade_level").notNull(),
  category: text("category").notNull(), // academic, extracurricular, testing, college_prep
  title: text("title").notNull(),
  description: text("description").notNull(),
  recommendedTiming: text("recommended_timing"), // fall, spring, summer
  isRequired: boolean("is_required").default(false),
  order: integer("order").default(0),
});

// Track user's progress on grade-specific milestones
export const userMilestones = pgTable("user_milestones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  milestoneId: integer("milestone_id").references(() => gradeMilestones.id).notNull(),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
});

export const userResourceViews = pgTable("user_resource_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  userColleges: many(userColleges),
  feedback: many(feedback),
  deadlines: many(deadlines),
  forumPosts: many(forumPosts),
  forumReplies: many(forumReplies),
  documents: many(documents),
  userResourceViews: many(userResourceViews),
  usersMajors: many(usersMajors),
}));

export const majorsRelations = relations(majors, ({ many }) => ({
  usersMajors: many(usersMajors),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
}));

export const collegesRelations = relations(colleges, ({ many }) => ({
  userColleges: many(userColleges),
  deadlines: many(deadlines),
}));

export const userCollegesRelations = relations(userColleges, ({ one }) => ({
  user: one(users, {
    fields: [userColleges.userId],
    references: [users.id],
  }),
  college: one(colleges, {
    fields: [userColleges.collegeId],
    references: [colleges.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [feedback.reviewerId],
    references: [users.id],
  }),
}));

export const deadlinesRelations = relations(deadlines, ({ one }) => ({
  user: one(users, {
    fields: [deadlines.userId],
    references: [users.id],
  }),
  college: one(colleges, {
    fields: [deadlines.collegeId],
    references: [colleges.id],
  }),
}));

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [forumPosts.userId],
    references: [users.id],
  }),
  replies: many(forumReplies),
}));

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  post: one(forumPosts, {
    fields: [forumReplies.postId],
    references: [forumPosts.id],
  }),
  user: one(users, {
    fields: [forumReplies.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const gradeGoalsRelations = relations(gradeGoals, ({ one }) => ({
  user: one(users, {
    fields: [gradeGoals.userId],
    references: [users.id],
  }),
}));

export const gradeMilestonesRelations = relations(gradeMilestones, ({ many }) => ({
  userMilestones: many(userMilestones),
}));

export const userMilestonesRelations = relations(userMilestones, ({ one }) => ({
  user: one(users, {
    fields: [userMilestones.userId],
    references: [users.id],
  }),
  milestone: one(gradeMilestones, {
    fields: [userMilestones.milestoneId],
    references: [gradeMilestones.id],
  }),
}));

export const resourcesRelations = relations(resources, ({ many }) => ({
  userResourceViews: many(userResourceViews),
  resourceEligibles: many(resourceEligibles),
  resourceTags: many(resourceTags),
}));

export const eligiblesRelations = relations(eligibles, ({ many }) => ({
  resourceEligibles: many(resourceEligibles),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  resourceTags: many(resourceTags),
}));

export const userResourceViewsRelations = relations(userResourceViews, ({ one }) => ({
  user: one(users, {
    fields: [userResourceViews.userId],
    references: [users.id],
  }),
  resource: one(resources, {
    fields: [userResourceViews.resourceId],
    references: [resources.id],
  }),
}));

export const userMajorsRelations = relations(usersMajors, ({ one }) => ({
  user: one(users, {
    fields: [usersMajors.userId],
    references: [users.id],
  }),
  majors: one(majors, {
    fields: [usersMajors.majorId],
    references: [majors.id],
  }),
}));

export const resourceEligiblesRelations = relations(resourceEligibles, ({ one }) => ({
  resources: one(resources, {
    fields: [resourceEligibles.resourceId],
    references: [resources.id],
  }),
  eligibles: one(eligibles, {
    fields: [resourceEligibles.eligibleId],
    references: [eligibles.id],
  }),
}));

export const resourceTagsRelations = relations(resourceTags, ({ one }) => ({
  resources: one(resources, {
    fields: [resourceTags.resourceId],
    references: [resources.id],
  }),
  tags: one(tags, {
    fields: [resourceTags.tagId],
    references: [tags.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  updatedAt: true,
});

export const insertCollegeSchema = createInsertSchema(colleges).omit({
  id: true,
});

export const insertUserCollegeSchema = createInsertSchema(userColleges).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
});

export const insertDeadlineSchema = createInsertSchema(deadlines).omit({
  id: true,
  createdAt: true,
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({
  id: true,
  createdAt: true,
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertGradeGoalSchema = createInsertSchema(gradeGoals).omit({
  id: true,
  createdAt: true,
});

export const insertGradeMilestoneSchema = createInsertSchema(gradeMilestones).omit({
  id: true,
});

export const insertUserMilestoneSchema = createInsertSchema(userMilestones).omit({
  id: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
});

export const insertUserResourceViewSchema = createInsertSchema(userResourceViews).omit({
  id: true,
  viewedAt: true,
});

export const insertMajorsSchema = createInsertSchema(majors).omit({
  id: true
});

export const insertUsersMajorsSchema = createInsertSchema(usersMajors).omit({
  id: true
});

export const insertEligiblesSchema = createInsertSchema(eligibles).omit({
  id: true
});

export const insertResouceEligiblesSchema = createInsertSchema(resourceEligibles).omit({
  id: true
});

export const insertTagsSchema = createInsertSchema(tags).omit({
  id: true
});

export const insertResouceTagsSchema = createInsertSchema(resourceTags).omit({
  id: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type College = typeof colleges.$inferSelect;
export type InsertCollege = z.infer<typeof insertCollegeSchema>;
export type UserCollege = typeof userColleges.$inferSelect;
export type InsertUserCollege = z.infer<typeof insertUserCollegeSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = z.infer<typeof insertDeadlineSchema>;
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type GradeGoal = typeof gradeGoals.$inferSelect;
export type InsertGradeGoal = z.infer<typeof insertGradeGoalSchema>;
export type GradeMilestone = typeof gradeMilestones.$inferSelect;
export type InsertGradeMilestone = z.infer<typeof insertGradeMilestoneSchema>;
export type UserMilestone = typeof userMilestones.$inferSelect;
export type InsertUserMilestone = z.infer<typeof insertUserMilestoneSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type UserResourceView = typeof userResourceViews.$inferSelect;
export type InsertUserResourceView = z.infer<typeof insertUserResourceViewSchema>;
export type Major = typeof majors.$inferSelect;
export type InsertMajor = z.infer<typeof insertMajorsSchema>;
export type UsersMajor = typeof usersMajors.$inferSelect;
export type InsertUsersMajor = z.infer<typeof insertUsersMajorsSchema>;
export type Eligible = typeof eligibles.$inferSelect;
export type InsertEligible = z.infer<typeof insertEligiblesSchema>;
export type ResourceEligible = typeof resourceEligibles.$inferSelect;
export type InsertResourceEligible = z.infer<typeof insertResouceEligiblesSchema>;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagsSchema>;
export type ResourceTag = typeof resourceTags.$inferSelect;
export type InsertResourceTag = z.infer<typeof insertResouceTagsSchema>;
