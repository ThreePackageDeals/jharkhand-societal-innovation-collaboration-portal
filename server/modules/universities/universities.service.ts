import { prisma } from '../../config/db';
import { University } from '../../../src/types';

// JSONB columns may hold either a JSON array or a JSON-encoded string (legacy
// rows written with JSON.stringify). Normalize so the API always returns arrays.
const toArray = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
};

export class UniversityService {
  async getAllUniversities() {
    const universities = await prisma.university.findMany({
      include: { faculty: true },
    });
    return universities.map(u => ({
      ...u,
      specializationDomains: toArray(u.specializationDomains),
      departments: toArray(u.departments),
    }));
  }

  async getUniversityById(id: string) {
    const uni = await prisma.university.findUnique({
      where: { id },
      include: { faculty: true },
    });
    if (!uni) return null;
    return {
      ...uni,
      specializationDomains: toArray(uni.specializationDomains),
      departments: toArray(uni.departments),
    };
  }

  async createUniversity(data: any) {
    const { specializationDomains, departments, ...rest } = data;
    const newUni = await prisma.university.create({
      data: {
        ...rest,
        specializationDomains: specializationDomains || [],
        departments: departments || [],
      },
    });
    return {
      ...newUni,
      specializationDomains: toArray(newUni.specializationDomains),
      departments: toArray(newUni.departments),
    };
  }

  async updateUniversity(id: string, data: any) {
    const { specializationDomains, departments, ...rest } = data;
    const updateData: any = { ...rest };
    if (specializationDomains) updateData.specializationDomains = specializationDomains;
    if (departments) updateData.departments = departments;

    const updatedUni = await prisma.university.update({
      where: { id },
      data: updateData,
    });
    return {
      ...updatedUni,
      specializationDomains: toArray(updatedUni.specializationDomains),
      departments: toArray(updatedUni.departments),
    };
  }

  async deleteUniversity(id: string) {
    return await prisma.university.delete({
      where: { id },
    });
  }
}

export const universityService = new UniversityService();
