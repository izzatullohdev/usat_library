export interface BookData {
  id: string
  book_id: string
  language_id: string
  alphabet_id: string
  status_id: number
  pdf_id: string
  createdAt: string
  updatedAt: string
  kafedra_id: string | null
  Book: {
    id: string
    name: string
    author_id: string | null
    year: number
    page: number
    books: number
    book_count: number
    description: string
    image_id: string
    createdAt: string
    updatedAt: string
    auther_id: string
    Auther: {
      id: string
      name: string
      createdAt: string
      updatedAt: string
    }
    image: {
      id: string
      filename: string
      path: string
      url: string
      mimetype: string
      size: number
      createdAt: string
      updatedAt: string
    }
  }
  Language: {
    id: string
    name: string
    createdAt: string
    updatedAt: string
  }
  Alphabet: {
    id: string
    name: string
    createdAt: string
    updatedAt: string
  }
  Status: {
    id: string
    name: string
    createdAt: string
    updatedAt: string
  }
  PDFFile: {
    id: string
    file_url: string
    original_name: string
    file_size: number
  }
  BookCategoryKafedras: {
    category_id: string
    kafedra_id: string
    category: {
      id: string
      name_uz: string
      name_ru: string
    }
    kafedra: {
      id: string
      name_uz: string
      name_ru: string
    }
  }
}



export interface Category {
  id: string
  name_uz: string
  name_ru: string
  code: string
  createdAt: string
  updatedAt: string
}

export interface Kafedra {
  id: string
  name_uz: string
  name_ru: string
  createdAt: string
  updatedAt: string
}