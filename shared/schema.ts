import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().$type<"high" | "medium" | "low">(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull().$type<"plasa" | "bono" | "escala" | "cardapio">(),
  category: text("category").$type<"oficial" | "praca">(),
  active: boolean("active").notNull().default(true),
  uploadDate: timestamp("upload_date").defaultNow(),
});

export const dutyOfficers = pgTable("duty_officers", {
  id: serial("id").primaryKey(),
  officerId: integer("officer_id").references(() => militaryPersonnel.id),
  masterId: integer("master_id").references(() => militaryPersonnel.id),
  // Campos legados para compatibilidade durante migração
  officerName: text("officer_name").default(""),
  masterName: text("master_name").default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const militaryPersonnel = pgTable("military_personnel", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rank: text("rank").notNull().$type<"cmg" | "cf" | "cc" | "ct" | "1t" | "2t" | "1sg" | "2sg" | "3sg">(),
  type: text("type").notNull().$type<"officer" | "master">(),
  specialty: text("specialty"),
  fullRankName: text("full_rank_name").notNull(),
  dutyRole: text("duty_role").$type<"officer" | "master" | null>(), // 🔥 NOVO: Papel no serviço (officer, master ou null)
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertNoticeSchema = createInsertSchema(notices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
});

export const insertDutyOfficersSchema = createInsertSchema(dutyOfficers).omit({
  id: true,
  updatedAt: true,
});

export const insertMilitaryPersonnelSchema = createInsertSchema(militaryPersonnel).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
export type PDFDocument = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DutyOfficers = typeof dutyOfficers.$inferSelect;
export type InsertDutyOfficers = z.infer<typeof insertDutyOfficersSchema>;
export type MilitaryPersonnel = typeof militaryPersonnel.$inferSelect;
export type InsertMilitaryPersonnel = z.infer<typeof insertMilitaryPersonnelSchema>;
