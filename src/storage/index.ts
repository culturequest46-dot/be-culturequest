import { 
  users, resumes, colleges, userColleges, feedback, deadlines, 
  forumPosts, forumReplies, documents, resources, userResourceViews, majors, usersMajors,
  type User, type InsertUser, type Resume, type InsertResume,
  type College, type InsertCollege, type UserCollege, type InsertUserCollege,
  type Feedback, type InsertFeedback, type Deadline, type InsertDeadline,
  type ForumPost, type InsertForumPost, type ForumReply, type InsertForumReply,
  type Document, type InsertDocument, type Resource, type InsertResource,
  type UserResourceView, type InsertUserResourceView, type Major, type InsertMajor, 
  type UsersMajor, type InsertUsersMajor
} from "../schema";
import { db } from "../db";
import { eq, desc, asc, like, and, sql, count } from "drizzle-orm";

type ForumPostWithUser = ForumPost & { user: User };
type ForumReplyWithUser = ForumReply & { user: User };

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;

  // Major methods
  getMajor(name: string): Promise<Major | undefined>;
  createMajor(major: InsertMajor): Promise<Major>;
  getAllMajors(): Promise<Major[]>;

  // Resume methods
  getResume(userId: number): Promise<Resume | undefined>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(userId: number, resume: Partial<InsertResume>): Promise<Resume | undefined>;

  // College methods
  getColleges(limit?: number, search?: string): Promise<College[]>;
  getCollege(id: number): Promise<College | undefined>;
  createCollege(college: InsertCollege): Promise<College>;

  // User College methods
  getUserColleges(userId: number): Promise<(UserCollege & { college: College })[]>;
  addUserCollege(userCollege: InsertUserCollege): Promise<UserCollege>;
  updateUserCollege(id: number, userCollege: Partial<InsertUserCollege>): Promise<UserCollege | undefined>;
  removeUserCollege(userId: number, collegeId: number): Promise<boolean>;

  // Feedback methods
  getFeedbackForUser(userId: number): Promise<(Feedback & { reviewer: User })[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;

  // Deadline methods
  getDeadlines(userId: number): Promise<(Deadline & { college?: College })[]>;
  createDeadline(deadline: InsertDeadline): Promise<Deadline>;
  updateDeadline(id: number, deadline: Partial<InsertDeadline>): Promise<Deadline | undefined>;

  // Forum methods
  getForumPosts(category?: string, limit?: number): Promise<(ForumPost & { user: User })[]>;
  getForumPost(id: number): Promise<(ForumPost & { user: User; replyList: (ForumReply & { user: User })[] }) | undefined>
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  createForumReply(reply: InsertForumReply): Promise<ForumReply>;

  // Document methods
  getUserDocuments(userId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;

  // Resource methods (temporarily handled frontend-only)
  // getResources(category?: string, ageRange?: string, limit?: number): Promise<Resource[]>;
  // getResource(id: number): Promise<Resource | undefined>;
  // createResource(resource: InsertResource): Promise<Resource>;
}

export class DatabaseStorage implements IStorage {
  async getMajor(name: string): Promise<Major | undefined> {
    const [major] = await db.select().from(majors).where(eq(majors.name, name));
    return major || undefined;
  }

  async createMajor(insertMajor: InsertMajor): Promise<Major> {
    const [major] = await db.insert(majors).values(insertMajor).returning();
    return major;
  }

  async getAllMajors(): Promise<Major[]> {
    return await db.select().from(majors).orderBy(asc(majors.name));
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<
    (Omit<typeof users.$inferSelect, "usersMajors"> & {
      interestedMajors: typeof majors.$inferSelect[];
    }) | undefined
  > {
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
      with: {
        usersMajors: {
          with: {
            majors: true
          }
        }
      }
    });

    if (!user) return undefined;

    const interestedMajors = user.usersMajors.map((item) => item.majors);

    const { usersMajors: _omit, ...userWithoutUsersMajors } = user;

    return {
      ...userWithoutUsersMajors,
      interestedMajors,
    };
  }


  async createUser(insertUser: InsertUser & { interestedMajors: number[] }): Promise<User> {
    const { interestedMajors, ...userData } = insertUser;
    const [user] = await db.insert(users).values(userData).returning();

    if (interestedMajors?.length > 0) {
      const userMajorValues = interestedMajors.map((majorId) => ({
        userId: user.id,
        majorId: majorId,
      }));
      await db.insert(usersMajors).values(userMajorValues);
    }

    return user;
  }

  async deleteUser(email: string): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.email, email));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateUser).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getResume(userId: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.userId, userId));
    return resume || undefined;
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const [resume] = await db.insert(resumes).values(insertResume).returning();
    return resume;
  }

  async updateResume(userId: number, updateResume: Partial<InsertResume>): Promise<Resume | undefined> {
    const [resume] = await db.update(resumes)
      .set({ ...updateResume, updatedAt: new Date() })
      .where(eq(resumes.userId, userId))
      .returning();
    return resume || undefined;
  }

  async getResourceDetail(title: string): Promise<Resource | undefined> {
    const result = await db
      .select()
      .from(resources)
      .where(eq(resources.title, title))
      .orderBy(asc(resources.title));

    return result[0];
  }

  async getResources(limit = 50, search?: string, academic?: string, age?: number): Promise<Resource[]> {
    return await db
        .select()
        .from(resources)
        .where(like(resources.title, `%${search}%`))
        .limit(limit)
        .orderBy(asc(resources.title));
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resourceItem] = await db.insert(resources).values(insertResource).returning();
    return resourceItem;
  }

  async getColleges(limit = 50, search?: string): Promise<College[]> {
    if (search) {
      return await db
        .select()
        .from(colleges)
        .where(like(colleges.name, `%${search}%`))
        .limit(limit)
        .orderBy(asc(colleges.name));
    }

    return await db
      .select()
      .from(colleges)
      .limit(limit)
      .orderBy(asc(colleges.name));
  }


  async getCollege(id: number): Promise<College | undefined> {
    const [college] = await db.select().from(colleges).where(eq(colleges.id, id));
    return college || undefined;
  }

  async createCollege(insertCollege: InsertCollege): Promise<College> {
    const [college] = await db.insert(colleges).values(insertCollege).returning();
    return college;
  }

  async getUserColleges(userId: number): Promise<(UserCollege & { college: College })[]> {
    const rows = await db.select()
      .from(userColleges)
      .innerJoin(colleges, eq(userColleges.collegeId, colleges.id))
      .where(eq(userColleges.userId, userId))
      .orderBy(desc(userColleges.priority));

    return rows.map(row => ({
      ...row.user_colleges,
      college: row.colleges
    }));
  }


  async addUserCollege(insertUserCollege: InsertUserCollege): Promise<UserCollege> {
    const [userCollege] = await db.insert(userColleges).values(insertUserCollege).returning();
    return userCollege;
  }

  async updateUserCollege(id: number, updateUserCollege: Partial<InsertUserCollege>): Promise<UserCollege | undefined> {
    const [userCollege] = await db.update(userColleges)
      .set(updateUserCollege)
      .where(eq(userColleges.id, id))
      .returning();
    return userCollege || undefined;
  }

  async removeUserCollege(userId: number, collegeId: number): Promise<boolean> {
    const result = await db.delete(userColleges)
      .where(and(eq(userColleges.userId, userId), eq(userColleges.collegeId, collegeId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getFeedbackForUser(userId: number): Promise<(Feedback & { reviewer: User })[]> {
    const rows = await db.select()
      .from(feedback)
      .innerJoin(users, eq(feedback.reviewerId, users.id))
      .where(eq(feedback.userId, userId))
      .orderBy(desc(feedback.createdAt));

    return rows.map(row => ({
      ...row.feedback,
      reviewer: row.users
    }));
  }


  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const [feedbackItem] = await db.insert(feedback).values(insertFeedback).returning();
    return feedbackItem;
  }

  async getDeadlines(userId: number): Promise<(Deadline & { college?: College })[]> {
    const rows = await db.select()
      .from(deadlines)
      .leftJoin(colleges, eq(deadlines.collegeId, colleges.id))
      .where(eq(deadlines.userId, userId))
      .orderBy(asc(deadlines.dueDate));

    return rows.map(row => ({
      ...row.deadlines,
      college: row.colleges ?? undefined
    }));
  }


  async createDeadline(insertDeadline: InsertDeadline): Promise<Deadline> {
    const [deadline] = await db.insert(deadlines).values(insertDeadline).returning();
    return deadline;
  }

  async updateDeadline(id: number, updateDeadline: Partial<InsertDeadline>): Promise<Deadline | undefined> {
    const [deadline] = await db.update(deadlines)
      .set(updateDeadline)
      .where(eq(deadlines.id, id))
      .returning();
    return deadline || undefined;
  }

  async getForumPosts(category?: string, limit = 20): Promise<(ForumPost & { user: User })[]> {
    const baseQuery = db.select()
      .from(forumPosts)
      .innerJoin(users, eq(forumPosts.userId, users.id));

    const finalQuery = category
      ? baseQuery.where(eq(forumPosts.category, category))
      : baseQuery;

    const rows = await finalQuery.orderBy(desc(forumPosts.createdAt)).limit(limit);

    return rows.map(row => ({
      ...row.forum_posts,
      user: row.users
    }));
  }

  async getForumPost(id: number): Promise<(ForumPost & { user: User; replyList: (ForumReply & { user: User })[] }) | undefined> {
    const [post] = await db.select()
      .from(forumPosts)
      .innerJoin(users, eq(forumPosts.userId, users.id))
      .where(eq(forumPosts.id, id));

    if (!post) return undefined;

    const replies = await db.select()
      .from(forumReplies)
      .innerJoin(users, eq(forumReplies.userId, users.id))
      .where(eq(forumReplies.postId, id))
      .orderBy(asc(forumReplies.createdAt));

    return {
      ...post.forum_posts,
      user: post.users,
      replyList: replies.map(r => ({
        ...r.forum_replies,
        user: r.users
      }))
    };
  }


  async createForumPost(insertPost: InsertForumPost): Promise<ForumPost> {
    const [post] = await db.insert(forumPosts).values(insertPost).returning();
    return post;
  }

  async createForumReply(insertReply: InsertForumReply): Promise<ForumReply> {
    const [reply] = await db.insert(forumReplies).values(insertReply).returning();
    
    // Update reply count
    await db.update(forumPosts)
      .set({ replies: sql`${forumPosts.replies} + 1` })
      .where(eq(forumPosts.id, insertReply.postId));

    return reply;
  }

  async getUserDocuments(userId: number): Promise<Document[]> {
    return await db.select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.uploadedAt));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(insertDocument).returning();
    return document;
  }


}

export const storage = new DatabaseStorage();
