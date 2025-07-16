'use server';

import { db } from '@/db';
import { news, users } from '@/db/schema';
import { News, NewNews, User, NewsWithRelations } from '@/lib/types';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getNews(): Promise<NewsWithRelations[]> {
  try {
    const result = await db
      .select({
        news: news,
        createdByUser: users,
      })
      .from(news)
      .leftJoin(users, eq(news.createdBy, users.id))
      .orderBy(desc(news.createdAt));

    return result.map(row => ({
      ...row.news,
      createdByUser: row.createdByUser || undefined,
    }));
  } catch (error) {
    console.error('Error fetching news:', error);
    throw new Error('Failed to fetch news');
  }
}

export async function getNewsById(id: string): Promise<NewsWithRelations | null> {
  try {
    const result = await db
      .select({
        news: news,
        createdByUser: users,
      })
      .from(news)
      .leftJoin(users, eq(news.createdBy, users.id))
      .where(eq(news.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const newsData = result[0];
    
    return {
      ...newsData.news,
      createdByUser: newsData.createdByUser || undefined,
    };
  } catch (error) {
    console.error('Error fetching news by ID:', error);
    throw new Error('Failed to fetch news');
  }
}

export async function createNews(data: Omit<NewNews, 'id' | 'createdAt' | 'updatedAt'>): Promise<News> {
  try {
    const result = await db
      .insert(news)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath('/novedades');
    return result[0];
  } catch (error) {
    console.error('Error creating news:', error);
    throw new Error('Failed to create news');
  }
}

export async function updateNews(id: string, data: Partial<NewNews>): Promise<News | null> {
  try {
    const result = await db
      .update(news)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(news.id, id))
      .returning();

    if (result.length === 0) return null;

    revalidatePath('/novedades');
    return result[0];
  } catch (error) {
    console.error('Error updating news:', error);
    throw new Error('Failed to update news');
  }
}

export async function deleteNews(id: string): Promise<boolean> {
  try {
    const result = await db
      .delete(news)
      .where(eq(news.id, id))
      .returning();

    revalidatePath('/novedades');
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting news:', error);
    throw new Error('Failed to delete news');
  }
}

export async function publishNews(id: string): Promise<boolean> {
  try {
    const result = await db
      .update(news)
      .set({
        publishedAt: new Date(),
        status: 'ACTIVE',
        updatedAt: new Date(),
      })
      .where(eq(news.id, id))
      .returning();

    revalidatePath('/novedades');
    return result.length > 0;
  } catch (error) {
    console.error('Error publishing news:', error);
    throw new Error('Failed to publish news');
  }
}

export async function searchNews(query: string): Promise<NewsWithRelations[]> {
  try {
    const result = await db
      .select({
        news: news,
        createdByUser: users,
      })
      .from(news)
      .leftJoin(users, eq(news.createdBy, users.id))
      .where(
        or(
          ilike(news.title, `%${query}%`),
          ilike(news.content, `%${query}%`),
          ilike(news.summary, `%${query}%`)
        )
      )
      .orderBy(desc(news.createdAt));

    return result.map(row => ({
      ...row.news,
      createdByUser: row.createdByUser || undefined,
    }));
  } catch (error) {
    console.error('Error searching news:', error);
    throw new Error('Failed to search news');
  }
}

export async function getNewsStats() {
  try {
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`count(*) filter (where status = 'ACTIVE')`,
        inactive: sql<number>`count(*) filter (where status = 'INACTIVE')`,
        published: sql<number>`count(*) filter (where published_at is not null)`,
        drafts: sql<number>`count(*) filter (where published_at is null)`,
        thisMonth: sql<number>`count(*) filter (where created_at >= date_trunc('month', current_date))`,
      })
      .from(news);

    return stats[0];
  } catch (error) {
    console.error('Error fetching news stats:', error);
    throw new Error('Failed to fetch news statistics');
  }
}

export async function getUsersForNews(): Promise<User[]> {
  try {
    const result = await db
      .select()
      .from(users)
      .orderBy(users.firstName, users.lastName);

    return result;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}