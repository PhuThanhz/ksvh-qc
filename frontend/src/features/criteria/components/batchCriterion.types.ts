
export interface BatchItem {
  key: string
  code: string
  name: string
  baseImpact: number
  checkMethod: string
}


export function getPrefix(groupCode?: string): string {
  if (!groupCode) return 'TC'
  return groupCode.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'TC'
}
