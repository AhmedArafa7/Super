'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initializeFirebase } from '@/firebase';
import { 
  collection, doc, getDocs, setDoc, updateDoc, 
  query, orderBy, addDoc, deleteDoc, where, limit 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export type BookStatus = 'approved' | 'pending' | 'rejected';

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverUrl: string;
  fileUrl: string;
  category: string;
  status: BookStatus;
  uploaderId: string;
  uploaderName: string;
  downloadCount: number;
  createdAt: string;
  fileSize: string;
}

interface LibraryState {
  books: Book[];
  isLoading: boolean;
  categories: string[];
  
  fetchBooks: (status?: BookStatus, category?: string) => Promise<void>;
  uploadBook: (data: Omit<Book, 'id' | 'status' | 'downloadCount' | 'createdAt'>) => Promise<void>;
  approveBook: (bookId: string) => Promise<void>;
  rejectBook: (bookId: string) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  incrementDownload: (bookId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      books: [],
      isLoading: false,
      categories: ["إسلامية", "أدب", "تاريخ", "علوم", "تنمية بشرية", "روايات", "أطفال", "أخرى"],

      fetchBooks: async (status = 'approved', category) => {
        set({ isLoading: true });
        const { firestore } = initializeFirebase();
        try {
          let q = query(
            collection(firestore, 'library_books'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
          );
          
          if (category && category !== 'الكل') {
            q = query(q, where('category', '==', category));
          }

          const snap = await getDocs(q);
          const books = snap.docs.map(d => ({ id: d.id, ...d.data() } as Book));
          set({ books, isLoading: false });
        } catch (error) {
          console.error("Error fetching books:", error);
          set({ isLoading: false });
        }
      },

      uploadBook: async (data) => {
        const { firestore } = initializeFirebase();
        try {
          await addDoc(collection(firestore, 'library_books'), {
            ...data,
            status: 'pending',
            downloadCount: 0,
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          console.error("Error uploading book metadata:", error);
          throw error;
        }
      },

      approveBook: async (bookId) => {
        const { firestore } = initializeFirebase();
        try {
          await updateDoc(doc(firestore, 'library_books', bookId), { status: 'approved' });
          set(state => ({
            books: state.books.map(b => b.id === bookId ? { ...b, status: 'approved' } : b)
          }));
        } catch (error) {
          console.error("Error approving book:", error);
        }
      },

      rejectBook: async (bookId) => {
        const { firestore } = initializeFirebase();
        try {
          await updateDoc(doc(firestore, 'library_books', bookId), { status: 'rejected' });
          set(state => ({
            books: state.books.filter(b => b.id !== bookId)
          }));
        } catch (error) {
          console.error("Error rejecting book:", error);
        }
      },

      deleteBook: async (bookId) => {
        const { firestore } = initializeFirebase();
        try {
          await deleteDoc(doc(firestore, 'library_books', bookId));
          set(state => ({
            books: state.books.filter(b => b.id !== bookId)
          }));
        } catch (error) {
          console.error("Error deleting book:", error);
        }
      },

      incrementDownload: async (bookId) => {
        const { firestore } = initializeFirebase();
        try {
          const bookRef = doc(firestore, 'library_books', bookId);
          const currentCount = get().books.find(b => b.id === bookId)?.downloadCount || 0;
          await updateDoc(bookRef, { downloadCount: currentCount + 1 });
        } catch (error) {
          console.error("Error incrementing download:", error);
        }
      }
    }),
    {
      name: 'nexus-library-storage',
      partialize: (state) => ({ books: state.books }),
    }
  )
);
