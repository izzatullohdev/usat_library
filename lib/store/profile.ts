import { create } from "zustand"
import { setStorageItem, removeStorageItem, STORAGE_KEYS } from "../storage"

interface UserProfile {
  id: string
  fullname?: string
  full_name?: string
  phone: string
  role?: "teacher" | "student" | string
}

interface ProfileState {
  profile: UserProfile | null
  setProfile: (user: UserProfile) => void
  clearProfile: () => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  setProfile: (user) => {
    const name = user.fullname || user.full_name || ""
    const role = user.role || "user"

    setStorageItem(STORAGE_KEYS.FULLNAME, name)
    setStorageItem(STORAGE_KEYS.PHONE, user.phone)
    setStorageItem(STORAGE_KEYS.ROLE, role)
    setStorageItem(STORAGE_KEYS.USER_ID, user.id)

    set({
      profile: {
        id: user.id,
        fullname: name,
        phone: user.phone,
        role: role as "teacher" | "student" | string
      }
    })
  },
  clearProfile: () => {
    removeStorageItem(STORAGE_KEYS.FULLNAME)
    removeStorageItem(STORAGE_KEYS.PHONE)
    removeStorageItem(STORAGE_KEYS.ROLE)
    removeStorageItem(STORAGE_KEYS.USER_ID)
    set({ profile: null })
  }
}))
