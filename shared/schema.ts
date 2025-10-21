import { sql } from "drizzle-orm";
import { pgTable, text, serial, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
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
  type: text("type").notNull().$type<"plasa" | "escala" | "cardapio">(),
  category: text("category").$type<"oficial" | "praca">(),
  unit: text("unit").$type<"EAGM" | "1DN">(),
  active: boolean("active").notNull().default(true),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  uploadDate: timestamp("upload_date").defaultNow(),
});

export const militaryPersonnel = pgTable("military_personnel", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rank: text("rank").notNull().$type<"cmg" | "cf" | "cc" | "ct" | "1t" | "2t" | "1sg" | "2sg" | "3sg">(),
  type: text("type").notNull().$type<"officer" | "master">(),
  specialty: text("specialty"),
  fullRankName: text("full_rank_name").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dutyAssignments = pgTable("duty_assignments", {
  id: serial("id").primaryKey(),
  officerName: text("officer_name").notNull(),
  officerRank: text("officer_rank").$type<string | null>(),
  masterName: text("master_name").notNull(),
  masterRank: text("master_rank").$type<string | null>(),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
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

export const insertDocumentSchema = createInsertSchema(documents)
  .omit({
    id: true,
    uploadDate: true,
  })
  .extend({
    tags: z.array(z.string()).optional(),
    unit: z.enum(["EAGM", "1DN"]).optional(),
  });

export const insertMilitaryPersonnelSchema = createInsertSchema(militaryPersonnel).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const dutyOfficerNameSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform(value => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed.toUpperCase() : "";
    }

    return "";
  })
  .optional()
  .default("");

const dutyRankSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform(value => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed.toUpperCase() : undefined;
    }

    return undefined;
  })
  .optional();

export const dutyOfficersPayloadSchema = z.object({
  officerName: dutyOfficerNameSchema,
  masterName: dutyOfficerNameSchema,
  officerRank: dutyRankSchema,
  masterRank: dutyRankSchema,
  validFrom: z
    .union([z.string(), z.date()])
    .optional()
    .transform(value => {
      if (!value) return undefined;

      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid validFrom date");
      }

      return date;
    }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;
type DocumentSelect = typeof documents.$inferSelect;

export type PDFDocument = Omit<DocumentSelect, "tags" | "unit"> & {
  tags?: string[]; // Tags geradas dinamicamente e persistidas
  unit?: "EAGM" | "1DN"; // Unidade para cardápios
};
export type InsertDocument = Omit<z.infer<typeof insertDocumentSchema>, "tags" | "unit"> & {
  tags?: string[];
  unit?: "EAGM" | "1DN";
};
export type DutyOfficerRank = string;
export type DutyMasterRank = string;
export type DutyOfficersPayload = z.infer<typeof dutyOfficersPayloadSchema>;
export type InsertDutyOfficers = DutyOfficersPayload;
export type DutyOfficers = {
  id: number;
  officerName: string;
  masterName: string;
  officerRank?: DutyOfficersPayload["officerRank"];
  masterRank?: DutyOfficersPayload["masterRank"];
  validFrom: Date;
  updatedAt: Date;
};
export type MilitaryPersonnel = typeof militaryPersonnel.$inferSelect;
export type InsertMilitaryPersonnel = z.infer<typeof insertMilitaryPersonnelSchema>;
