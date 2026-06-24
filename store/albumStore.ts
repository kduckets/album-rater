'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GifComment } from '@/types'

interface AlbumStore {
  ratings: Record<string, number>
  comments: Record<string, GifComment[]>
  setRating: (albumId: string, rating: number) => void
  setComments: (albumId: string, comments: GifComment[]) => void
  addComment: (albumId: string, comment: GifComment) => void
  removeComment: (albumId: string, commentId: string) => void
}

export const useAlbumStore = create<AlbumStore>()(
  persist(
    (set) => ({
      ratings: {},
      comments: {},
      setRating: (albumId, rating) =>
        set((state) => {
          const newRatings = { ...state.ratings }
          if (rating === 0) delete newRatings[albumId]
          else newRatings[albumId] = rating
          return { ratings: newRatings }
        }),
      setComments: (albumId, comments) =>
        set((state) => ({
          comments: { ...state.comments, [albumId]: comments },
        })),
      addComment: (albumId, comment) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [albumId]: [...(state.comments[albumId] ?? []), comment],
          },
        })),
      removeComment: (albumId, commentId) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [albumId]: (state.comments[albumId] ?? []).filter((c) => c.id !== commentId),
          },
        })),
    }),
    { name: 'album-rater-store' }
  )
)
