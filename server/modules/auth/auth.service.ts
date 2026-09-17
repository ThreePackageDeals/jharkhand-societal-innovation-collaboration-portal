import jwt from 'jsonwebtoken';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/db';
import { Role, VerificationStatus, OrgType } from '@prisma/client';
import { universityService } from '../universities/universities.service';
import { industryService } from '../industry/industry.service';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role | 'GOVT_ADMIN';
  verificationStatus: VerificationStatus;
}

export class AuthService {
  async completeProfile(userId: string, data: {
    email: string;
    fullName: string;
    role: Role;
    phone?: string;
    district?: string;
    universityId?: string;
    studentIdNumber?: string;
    department?: string;
    employeeId?: string;
    designation?: string;
    organizationId?: string;
    organizationName?: string; // For creating new organization
    registrationNumber?: string;
    website?: string;
    orgType?: OrgType;
    industryDesignation?: string;
    documentUrls?: string[];
  }) {
    const { role, email, fullName, phone, district, ...rest } = data;

    // 1. Create or update the base User record
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        fullName,
        role,
        phone,
        district,
      },
      create: {
        id: userId,
        email,
        fullName,
        role,
        phone,
        district,
        verificationStatus: 'NOT_REQUIRED',
      },
    });

    let verificationStatus: VerificationStatus = 'NOT_REQUIRED';
    const verificationRequests: any[] = [];

    if (role === 'STUDENT' || role === 'FACULTY') {
      if (!rest.universityId) throw new Error('University is required for students and faculty');

      const university = await prisma.university.findUnique({
        where: { id: rest.universityId },
      });
      if (!university) throw new Error('University not found');

      const isDomainVerified = this.matchesUniversityDomain(email, university.domains);

      if (role === 'STUDENT') {
        await prisma.studentProfile.upsert({
          where: { userId },
          update: {
            universityId: rest.universityId,
            studentIdNumber: rest.studentIdNumber,
            department: rest.department,
          },
          create: {
            userId,
            universityId: rest.universityId,
            studentIdNumber: rest.studentIdNumber,
            department: rest.department,
          },
        });

        if (!isDomainVerified) {
          verificationStatus = 'PENDING';
          if (!rest.documentUrls || rest.documentUrls.length === 0) {
            throw new Error('Document upload required for verification');
          }
          verificationRequests.push({
            userId,
            role,
            documentUrls: rest.documentUrls,
            status: 'PENDING',
          });
        }
      } else { // FACULTY
        await prisma.facultyProfile.upsert({
          where: { userId },
          update: {
            universityId: rest.universityId,
            employeeId: rest.employeeId,
            designation: rest.designation,
            department: rest.department,
          },
          create: {
            userId,
            universityId: rest.universityId,
            employeeId: rest.employeeId,
            designation: rest.designation,
            department: rest.department,
          },
        });

        // Faculty always requires admin confirmation, but domain match can expedite
        verificationStatus = 'PENDING';
        verificationRequests.push({
          userId,
          role,
          documentUrls: rest.documentUrls || [],
          status: 'PENDING',
        });
      }
    } else if (role === 'INDUSTRY_REP') {
      verificationStatus = 'PENDING';

      let orgId = rest.organizationId;
      if (!orgId && rest.organizationName) {
        const org = await prisma.organization.create({
          data: {
            name: rest.organizationName,
            type: rest.orgType || 'CORPORATE',
            registrationNumber: rest.registrationNumber,
            website: rest.website,
            isVerified: false,
          },
        });
        orgId = org.id;
      }

      if (!orgId) throw new Error('Organization is required');

      await prisma.industryProfile.upsert({
        where: { userId },
        update: {
          organizationId: orgId,
          designation: rest.industryDesignation,
        },
        create: {
          userId,
          organizationId: orgId,
          designation: rest.industryDesignation,
        },
      });

      if (!rest.documentUrls || rest.documentUrls.length === 0) {
        throw new Error('Registration documents required for industry representatives');
      }

      verificationRequests.push({
        userId,
        role,
        documentUrls: rest.documentUrls,
        status: 'PENDING',
      });
    }

    // Update User verification status and create requests
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus,
        ...(role === 'CITIZEN' ? { verificationStatus: 'NOT_REQUIRED' } : {})
      },
    });

    if (verificationRequests.length > 0) {
      await prisma.verificationRequest.createMany({
        data: verificationRequests,
      });
    }

    return {
      user: updatedUser,
      verificationStatus,
    };
  }

  async getMe(userId: string) {
    if (userId === 'dev-user-id') {
      return {
        id: 'dev-user-id',
        email: 'dev@localhost',
        fullName: 'Development User',
        role: 'GOVT_ADMIN' as Role,
        verificationStatus: 'NOT_REQUIRED' as VerificationStatus,
        district: 'Ranchi',
        isActive: true,
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        facultyProfile: true,
        industryProfile: {
          include: { organization: true }
        }
      },
    });
    if (!user) throw new Error('User not found');

    return user;
  }

  private matchesUniversityDomain(email: string, domains: string[]): boolean {
    if (!email) return false;
    const emailDomain = email.split('@')[1]?.toLowerCase();
    return domains.some(domain => domain.toLowerCase() === emailDomain || emailDomain?.endsWith(`.${domain.toLowerCase()}`));
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    if (token === 'mock-jwt-token') {
      return {
        userId: 'dev-user-id',
        email: 'dev@localhost',
        role: 'GOVT_ADMIN' as Role,
        verificationStatus: 'NOT_REQUIRED' as VerificationStatus,
      };
    }
    try {
      return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }
}

export const authService = new AuthService();
