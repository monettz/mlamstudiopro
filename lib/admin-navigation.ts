export const adminSections=['overview','products','videos','releases','licenses','orders','notify'] as const;
export type AdminSection=typeof adminSections[number];
export function adminSection(value:unknown):AdminSection{return typeof value==='string'&&adminSections.some(section=>section===value)?value as AdminSection:'overview';}
export function adminDestination(value:unknown):string{const section=adminSection(value);return section==='overview'?'/admin':`/admin?section=${section}`;}
export function adminLoginDestination(value:unknown):string{const section=adminSection(value);return section==='overview'?'/admin/login':`/admin/login?section=${section}`;}
