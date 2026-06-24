export interface Album {
  id: string
  title: string
  year: number
  batchId: string
  artworkUrl: string
  label?: string
}

export interface Batch {
  id: string
  name: string
  description: string
  albums: Album[]
}

export interface GifComment {
  id: string
  albumId: string
  gifUrl: string
  timestamp: number
}

export type SortOrder = 'new' | 'top' | 'comments' | 'stars'
export type EraFilter = 'all' | '50s' | '60s' | '70s' | '80s+'
