import { useState, useEffect, useCallback } from 'react'
import { PROJECT_CATEGORIES, ProjectCategory } from '@/constants'

export interface Category {
  id: string
  label: string
  isCustom?: boolean
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([...PROJECT_CATEGORIES])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    try {
      // @ts-ignore
      const settings = await window.ipcRenderer.invoke('get-app-settings')
      const customCategories = settings.customCategories || []
      
      const allCategories = [
        ...PROJECT_CATEGORIES,
        ...customCategories.map((c: any) => ({ ...c, isCustom: true }))
      ]
      
      setCategories(allCategories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()

    const handleUpdate = () => {
      fetchCategories()
    }

    window.addEventListener('categories-updated', handleUpdate)
    return () => {
      window.removeEventListener('categories-updated', handleUpdate)
    }
  }, [fetchCategories])

  const addCategory = async (label: string) => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('add-custom-category', label)
      if (result.success) {
        window.dispatchEvent(new Event('categories-updated'))
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const removeCategory = async (categoryId: string) => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('remove-custom-category', categoryId)
      if (result.success) {
        window.dispatchEvent(new Event('categories-updated'))
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  const checkCategoryUsage = async (categoryId: string) => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('check-category-usage', categoryId)
      return result.count || 0
    } catch (error) {
      console.error('Failed to check category usage:', error)
      return 0
    }
  }

  const migrateProjectsCategory = async (oldCategoryId: string, newCategoryId: string) => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('update-projects-category', { oldCategoryId, newCategoryId })
      return result
    } catch (error) {
      console.error('Failed to migrate projects category:', error)
      throw error
    }
  }

  return {
    categories,
    loading,
    addCategory,
    removeCategory,
    checkCategoryUsage,
    migrateProjectsCategory,
    refreshCategories: fetchCategories
  }
}
